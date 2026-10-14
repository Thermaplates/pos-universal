import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const transactions = await prisma.transactions.findMany({
      orderBy: { created_at: 'desc' }, // Urutkan dari yang paling baru
      take: 50, // Ambil 50 transaksi terakhir agar tidak berat
      include: {
        transaction_payments: true, // Ambil info metode bayar
        user: true, // Ambil nama kasir
      }
    });
    return NextResponse.json(transactions);
  } catch (error) {
    console.error("Gagal fetch transaksi:", error);
    return NextResponse.json({ error: 'Gagal fetch transaksi' }, { status: 500 });
  }
}