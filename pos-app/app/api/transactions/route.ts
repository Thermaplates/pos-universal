import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { items, subtotal, tax_amount, grand_total, paymentMethod } = body;

    // 1. BUAT DUMMY DATA UNTUK RELASI (Karena belum ada sistem Login Kasir)
    let branch = await prisma.branches.findFirst();
    if (!branch) branch = await prisma.branches.create({ data: { name: 'Cabang Pusat' } });

    let user = await prisma.users.findFirst();
    if (!user) user = await prisma.users.create({ data: { branch_id: branch.id, name: 'Kasir Shift 1', password: '123', role: 'cashier' } });

    let shift = await prisma.shifts.findFirst();
    if (!shift) shift = await prisma.shifts.create({ data: { branch_id: branch.id, user_id: user.id } });

    // 2. SESUAIKAN METODE BAYAR DENGAN ENUM DATABASE
    let dbPaymentMethod = 'cash';
    if (paymentMethod === 'qris' || paymentMethod === 'ewallet') dbPaymentMethod = 'qris';
    else if (paymentMethod === 'debit') dbPaymentMethod = 'debit';

    // 3. SIMPAN KE DATABASE (Tabel Transactions, Details, dan Payments sekaligus)
    const transaction = await prisma.transactions.create({
      data: {
        branch_id: branch.id,
        user_id: user.id,
        shift_id: shift.id,
        invoice_number: `INV-${Date.now()}`, // Bikin nomor invoice otomatis
        subtotal: subtotal,
        tax_amount: tax_amount,
        grand_total: grand_total,
        
        // Simpan isi keranjang
        transaction_details: {
          create: items.map((item: any) => ({
            product_id: item.product_id,
            product_name: item.product_name,
            selling_price: item.selling_price,
            quantity: item.quantity,
            subtotal: item.subtotal
          }))
        },
        
        // Simpan cara bayarnya
        transaction_payments: {
          create: {
            payment_method: dbPaymentMethod as any,
            amount_paid: grand_total
          }
        }
      }
    });

    return NextResponse.json({ success: true, transaction });
  } catch (error: any) {
    console.error("GAGAL SIMPAN TRANSAKSI:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}