import { z } from 'zod';

export const receiptSchema = z.object({
  no_resit: z.string().min(1, 'Nomor resit diperlukan').max(50, 'Nomor resit terlalu panjang').toUpperCase(),
  no_lori: z.string().max(20, 'Nomor lori terlalu panjang').toUpperCase().optional().nullable(),
  blok: z.string().regex(/^\d+$/, 'Blok harus angka').max(5, 'Blok terlalu besar'),
  tan: z.union([z.string(), z.number()]).pipe(z.coerce.number().positive('Tan harus lebih dari 0')), 
  muda: z.union([z.string(), z.number()]).pipe(z.coerce.number().nonnegative('Muda tidak boleh negatif')).optional().default(0),
});

export function validateReceipt(data) {
  try {
    return receiptSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw { message: 'Validation failed', errors: error.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message,
      })), };
    }
    throw error;
  }
}