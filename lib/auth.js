import { jwtVerify } from 'jose';
const secret = new TextEncoder().encode(process.env.SUPABASE_JWT_SECRET || 'your-secret-key');
export async function verifyAuth(req) {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new Error('Missing or invalid authorization header');
    }
    const token = authHeader.substring(7);
    try {
        const verified = await jwtVerify(token, secret);
        const userId = verified.payload.sub;
        if (!userId) {
            throw new Error('Invalid token: missing user ID');
        }
        return { userId };
    } catch (error) {
        throw new Error(`Token verification failed: ${error.message}`);
    }
}