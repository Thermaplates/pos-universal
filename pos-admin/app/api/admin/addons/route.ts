import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Ambil semua Add-on, gabungkan (include) dengan nama produknya
    const addons = await prisma.product_modifiers.findMany({
      orderBy: { name: 'asc' },
      include: { product: true } 
    });
    return NextResponse.json(addons);
  } catch (error) {
    console.error("Gagal fetch Add-on:", error);
    return NextResponse.json({ error: 'Gagal fetch Add-on' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const newAddon = await prisma.product_modifiers.create({
      data: {
        product_id: body.product_id, // Add-on ini untuk produk mana?
        name: body.name,
        price: parseFloat(body.price),
      }
    });

    return NextResponse.json(newAddon);
  } catch (error: any) {
    console.error("GAGAL SIMPAN ADDON:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}