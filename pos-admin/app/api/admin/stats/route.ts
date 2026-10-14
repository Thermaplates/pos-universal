import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Hitung jumlah struk (invoice)
    const totalTransactions = await prisma.transactions.count();
    
    // Jumlahkan semua grand_total dari seluruh transaksi
    const revenueResult = await prisma.transactions.aggregate({
      _sum: { grand_total: true }
    });
    
    // Karena Prisma mengembalikan Decimal, kita ubah ke Number
    const totalRevenue = Number(revenueResult._sum.grand_total || 0);

    return NextResponse.json({ totalTransactions, totalRevenue });
  } catch (error) {
    return NextResponse.json({ error: 'Gagal fetch statistik' }, { status: 500 });
  }
}