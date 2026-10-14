import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // Pastikan file lib/prisma.ts juga sudah ada di pos-app

export async function GET() {
  try {
    const products = await prisma.products.findMany({
      orderBy: { name: 'asc' }
    });
    return NextResponse.json(products);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Gagal ambil produk' }, { status: 500 });
  }
}