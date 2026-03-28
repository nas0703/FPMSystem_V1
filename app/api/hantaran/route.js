import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyAuth } from '@/lib/auth';
import { validateReceipt } from '@/lib/validations';
import { logger } from '@/lib/logger';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role key for server operations
);

export async function POST(req) {
  const startTime = Date.now();

  try {
    // 1. Verify authentication
    let userId;
    try {
      const auth = await verifyAuth(req);
      userId = auth.userId;
    } catch (authError) {
      logger.warn('Auth failed', { error: authError.message });
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Parse and validate input
    let data;
    try {
      const body = await req.json();
      data = validateReceipt(body);
    } catch (validationError) {
      logger.warn('Validation failed', {
        error: validationError.message,
        userId,
      });
      return NextResponse.json(
        { error: validationError.errors?.[0]?.message || 'Invalid input' },
        { status: 400 }
      );
    }

    // 3. Check for duplicates
    const { data: existing } = await supabase
      .from('hantaran_hasil')
      .select('id')
      .eq('user_id', userId)
      .eq('no_resit', data.no_resit)
      .maybeSingle();

    if (existing) {
      logger.info('Duplicate entry attempted', { userId, no_resit: data.no_resit });
      return NextResponse.json(
        { error: 'Resit sudah wujud' },
        { status: 409 }
      );
    }

    // 4. Calculate package tier
    const blokNum = parseInt(data.blok);
    const pkt = blokNum <= 17 ? '001' : '002';

    // 5. Prepare payload
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];

    const payload = {
      user_id: userId,
      no_resit: data.no_resit,
      no_lori: data.no_lori,
      blok: data.blok,
      peringkat: `PKT ${pkt}`,
      tan: data.tan,
      muda: data.muda,
      tarikh: dateStr,
      created_at: now.toISOString(),
    };

    // 6. Insert into database
    const { error: insertError } = await supabase
      .from('hantaran_hasil')
      .insert([payload]);

    if (insertError) {
      logger.error('Database insert error', {
        error: insertError.message,
        userId,
        payload,
      });
      return NextResponse.json(
        { error: 'Failed to save receipt' },
        { status: 500 }
      );
    }

    // 7. Log success
    const duration = Date.now() - startTime;
    logger.info('Receipt created successfully', {
      userId,
      no_resit: data.no_resit,
      duration: `${duration}ms`,
    });

    return NextResponse.json({
      success: true,
      id: data.no_resit,
    });

  } catch (error) {
    logger.error('Unexpected error in POST /api/hantaran', {
      error: error.message,
      stack: error.stack,
    });

    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}

export async function GET(req) {
  const startTime = Date.now();

  try {
    // 1. Verify authentication
    let userId;
    try {
      const auth = await verifyAuth(req);
      userId = auth.userId;
    } catch (authError) {
      logger.warn('Auth failed on GET', { error: authError.message });
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Parse query parameters
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page')) || 1);
    const limit = Math.min(100, parseInt(searchParams.get('limit')) || 50);
    const offset = (page - 1) * limit;

    // 3. Fetch data (filtered by user_id via RLS)
    const { data, error, count } = await supabase
      .from('hantaran_hasil')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      logger.error('Database query error', {
        error: error.message,
        userId,
      });
      return NextResponse.json(
        { error: 'Failed to fetch data' },
        { status: 500 }
      );
    }

    // 4. Log success
    const duration = Date.now() - startTime;
    logger.info('GET /api/hantaran', {
      userId,
      count: data.length,
      total: count,
      duration: `${duration}ms`,
    });

    return NextResponse.json({
      data,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil((count || 0) / limit),
      },
    });

  } catch (error) {
    logger.error('Unexpected error in GET /api/hantaran', {
      error: error.message,
      stack: error.stack,
    });

    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}