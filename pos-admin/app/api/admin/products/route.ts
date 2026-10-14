import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const products = await prisma.products.findMany({
      orderBy: { name: 'asc' }
    });
    return NextResponse.json(products);
  } catch (error) {
    console.error("Duh, Prisma Error nih:", error);
    return NextResponse.json({ error: 'Gagal fetch produk' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // 1. Cek atau buat kategori
    let category = await prisma.categories.findFirst();
    if (!category) {
      category = await prisma.categories.create({
        data: { name: 'Umum' }
      });
    }

    // 2. Simpan produk (Harga dibiarkan dalam bentuk string karena Prisma Decimal lebih aman menerima string)
    const newProduct = await prisma.products.create({
      data: {
        category_id: category.id,
        sku: body.sku,
        name: body.name,
        base_price: body.base_price, 
        selling_price: body.selling_price,
      }
    });

    return NextResponse.json(newProduct);
  } catch (error: any) {
    // Tulis detail error di terminal dan kirim ke frontend
    console.error("GAGAL SIMPAN PRODUK:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}