import { z } from 'zod';

export const businessFinanceSchema = z.object({
  business_name: z.string().trim().min(1, { message: "Nama bisnis tidak boleh kosong" }).max(100, { message: "Nama bisnis maksimal 100 karakter" }),
  category: z.string().trim().min(1, { message: "Kategori tidak boleh kosong" }).max(50, { message: "Kategori maksimal 50 karakter" }),
  description: z.string().max(500, { message: "Deskripsi maksimal 500 karakter" }).optional(),
  amount: z.number().positive({ message: "Jumlah harus lebih dari 0" }).finite({ message: "Jumlah tidak valid" }),
  transaction_type: z.enum(['income', 'expense'], { message: "Tipe transaksi tidak valid" }),
  transaction_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Format tanggal tidak valid" }),
});

export const cryptoHoldingSchema = z.object({
  coin_name: z.string().trim().min(1, { message: "Nama coin tidak boleh kosong" }).max(100, { message: "Nama coin maksimal 100 karakter" }),
  symbol: z.string().trim().min(1, { message: "Symbol tidak boleh kosong" }).max(10, { message: "Symbol maksimal 10 karakter" }).regex(/^[A-Z0-9]+$/, { message: "Symbol harus huruf kapital dan angka" }),
  coin_id: z.string().trim().min(1, { message: "Coin ID tidak boleh kosong" }).max(50, { message: "Coin ID maksimal 50 karakter" }),
  amount: z.number().positive({ message: "Jumlah harus lebih dari 0" }).finite({ message: "Jumlah tidak valid" }),
  purchase_price: z.number().positive({ message: "Harga harus lebih dari 0" }).finite({ message: "Harga tidak valid" }),
  purchase_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Format tanggal tidak valid" }),
});

export type BusinessFinanceInput = z.infer<typeof businessFinanceSchema>;
export type CryptoHoldingInput = z.infer<typeof cryptoHoldingSchema>;
