"use client";
import { useState, useEffect } from 'react';
import { useCartStore, Addon, CartItem } from '../store/cartStore';
import { ShoppingCart, Plus, Minus, Trash2, Search, Coffee, X, QrCode, Banknote, CreditCard, Smartphone, MessageSquarePlus } from 'lucide-react';

// DUMMY ADD-ONS (Nanti ditarik dari tabel product_modifiers via API)
const DUMMY_ADDONS = [
  { name: "Extra Shot Espresso", price: 5000 },
  { name: "Less Sugar", price: 0 },
  { name: "Oat Milk", price: 8000 },
  { name: "Ice Cream Topping", price: 6000 },
  { name: "Takeaway Cup", price: 2000 },
];

export default function POSPage() {
  const { items, subtotal, tax_amount, grand_total, addToCart, updateQuantity, removeFromCart, clearCart, updateItemOptions } = useCartStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Checkout States
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [selectedSubMethod, setSelectedSubMethod] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // === MODAL ADD-ON & NOTES STATES ===
  const [activeItemForNote, setActiveItemForNote] = useState<CartItem | null>(null);
  const [tempNote, setTempNote] = useState("");
  const [tempAddons, setTempAddons] = useState<Addon[]>([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch('/api/products');
        const data = await res.json();
        setProducts(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error(error);
      }
      setIsLoading(false);
    };
    fetchProducts();
  }, []);

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  // === FUNGSI BUKA/TUTUP MODAL NOTE ===
  const openNoteModal = (item: CartItem) => {
    setActiveItemForNote(item);
    setTempNote(item.note || "");
    setTempAddons(item.addons || []);
  };

  const toggleAddon = (addon: Addon) => {
    const exists = tempAddons.find(a => a.name === addon.name);
    if (exists) {
      setTempAddons(tempAddons.filter(a => a.name !== addon.name));
    } else {
      setTempAddons([...tempAddons, addon]);
    }
  };

 const saveNoteAndAddons = () => {
    if (activeItemForNote) {
      // Ubah dari product_id menjadi cart_item_id
      updateItemOptions(activeItemForNote.cart_item_id, tempNote, tempAddons);
      setActiveItemForNote(null);
    }
  };
  
  const selesaikanPesanan = async () => {
    setIsProcessing(true);
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, subtotal, tax_amount, grand_total, paymentMethod })
      });
      if (res.ok) {
        alert(`Pembayaran berhasil disimpan ke Database!`);
        clearCart();
        setIsCheckoutOpen(false);
        setPaymentMethod(""); setSelectedSubMethod("");
      } else {
        const err = await res.json();
        alert("Gagal menyimpan ke database:\n" + err.error);
      }
    } catch (error) {
      console.error(error);
    }
    setIsProcessing(false);
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans relative text-gray-900">
      
      {/* AREA KIRI: DAFTAR PRODUK */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="bg-white p-4 shadow-sm flex items-center justify-between z-10 border-b border-gray-200">
          <div className="flex items-center gap-2 text-xl font-bold text-blue-600">
            <Coffee className="w-8 h-8" /> <span>POS System</span>
          </div>
          <div className="relative w-96">
            <Search className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
            <input type="text" placeholder="Cari produk..." className="w-full pl-10 pr-4 py-2 bg-gray-100 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </header>

        <main className="flex-1 p-6 overflow-y-auto">
          {isLoading ? (
            <div className="h-full flex items-center justify-center text-gray-400 font-semibold animate-pulse">Memuat Menu dari Database...</div>
          ) : filteredProducts.length === 0 ? (
             <div className="h-full flex items-center justify-center text-gray-400 font-semibold">Belum ada produk. Tambahkan via Panel Admin!</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredProducts.map((product) => (
                <div key={product.id} onClick={() => addToCart({ product_id: product.id, product_sku: product.sku, product_name: product.name, selling_price: Number(product.selling_price) })} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-blue-400 cursor-pointer transition-all active:scale-95 flex flex-col h-32 justify-between">
                  <div>
                    <span className="text-xs font-semibold text-gray-500 mb-1 block">{product.sku}</span>
                    <h3 className="font-semibold text-gray-800 leading-tight">{product.name}</h3>
                  </div>
                  <div className="text-blue-600 font-bold">Rp {Number(product.selling_price).toLocaleString('id-ID')}</div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* AREA KANAN: KERANJANG */}
      <div className="w-96 bg-white shadow-[-4px_0_15px_rgba(0,0,0,0.05)] flex flex-col h-full z-20 border-l border-gray-200">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h2 className="text-lg font-bold flex items-center gap-2 text-gray-800"><ShoppingCart className="w-5 h-5" /> Keranjang</h2>
        </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {items.map((item) => (
            // KEY-nya sekarang menggunakan cart_item_id
            <div key={item.cart_item_id} className="flex flex-col p-3 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex justify-between font-semibold">
                <span className="text-gray-800">{item.product_name}</span>
                <span className="text-blue-600">Rp {item.subtotal.toLocaleString('id-ID')}</span>
              </div>
              
              {/* TAMPILAN NOTE & ADD-ON DI BAWAH NAMA PRODUK */}
              {(item.note || (item.addons && item.addons.length > 0)) && (
                <div className="mt-2 mb-1 pl-2 border-l-2 border-blue-400">
                  {item.addons?.map(a => (
                    <div key={a.name} className="text-xs text-gray-600 flex justify-between">
                      <span>+ {a.name}</span>
                      {a.price > 0 && <span>{a.price.toLocaleString('id-ID')}</span>}
                    </div>
                  ))}
                  {item.note && <div className="text-xs text-orange-600 italic mt-1">"{item.note}"</div>}
                </div>
              )}

              <div className="flex justify-between items-center mt-2">
                <div className="flex gap-2 items-center">
                  <div className="flex gap-3 bg-white border border-gray-200 rounded p-1">
                    {/* GUNAKAN cart_item_id BUKAN product_id */}
                    <button onClick={() => updateQuantity(item.cart_item_id, item.quantity - 1)} className="px-2 text-gray-600"><Minus className="w-3 h-3"/></button>
                    <span className="text-sm font-bold text-gray-800 w-4 text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.cart_item_id, item.quantity + 1)} className="px-2 text-gray-600"><Plus className="w-3 h-3"/></button>
                  </div>
                  {/* Tombol Note */}
                  <button onClick={() => openNoteModal(item)} className="p-2 text-blue-500 hover:bg-blue-100 rounded-lg transition-colors" title="Tambah Catatan/Add-on">
                    <MessageSquarePlus className="w-5 h-5" />
                  </button>
                </div>
                {/* Tombol Hapus */}
                <button onClick={() => removeFromCart(item.cart_item_id)} className="text-red-500 hover:bg-red-50 p-2 rounded"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between font-bold text-lg mb-4 text-gray-800">
            <span>Total Akhir</span>
            <span>Rp {grand_total.toLocaleString('id-ID')}</span>
          </div>
          <button disabled={items.length === 0} onClick={() => setIsCheckoutOpen(true)} className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:bg-gray-300">Checkout</button>
        </div>
      </div>

      {/* ================= MODAL ADD-ON & TEXT REQUEST ================= */}
      {activeItemForNote && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white w-[500px] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h2 className="text-lg font-bold text-gray-900">Opsi: {activeItemForNote.product_name}</h2>
              <button onClick={() => setActiveItemForNote(null)} className="text-gray-400 hover:text-gray-800"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Bagian Add-on */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Pilih Add-on (Bisa lebih dari 1)</h3>
                <div className="grid grid-cols-2 gap-3">
                  {DUMMY_ADDONS.map(addon => {
                    const isSelected = tempAddons.some(a => a.name === addon.name);
                    return (
                      <button 
                        key={addon.name} 
                        onClick={() => toggleAddon(addon)}
                        className={`p-3 border rounded-xl text-left flex flex-col transition-all ${
                          isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <span className={`text-sm font-semibold ${isSelected ? 'text-blue-700' : 'text-gray-800'}`}>{addon.name}</span>
                        <span className="text-xs text-gray-500">{addon.price > 0 ? `+Rp ${addon.price.toLocaleString('id-ID')}` : 'Gratis'}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Bagian Text Request */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Catatan Khusus (Text Request)</h3>
                <textarea 
                  rows={3} 
                  placeholder="Contoh: Jangan dipakein es batu, gulanya sedikit aja ya..."
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm resize-none"
                  value={tempNote}
                  onChange={(e) => setTempNote(e.target.value)}
                ></textarea>
              </div>
            </div>

            <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
              <button onClick={() => setActiveItemForNote(null)} className="px-5 py-2 text-gray-600 font-semibold hover:bg-gray-200 rounded-lg">Batal</button>
              <button onClick={saveNoteAndAddons} className="px-5 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700">Simpan Pilihan</button>
            </div>
          </div>
        </div>
      )}

    {/* ================= MODAL CHECKOUT ================= */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white w-[850px] rounded-2xl shadow-2xl flex overflow-hidden min-h-[500px] max-h-[90vh]">
            
            {/* Kiri: Ringkasan */}
            <div className="w-5/12 bg-gray-50 p-6 border-r border-gray-200 overflow-y-auto">
              <h2 className="text-xl font-bold mb-4 text-gray-900">Tagihan</h2>
              <div className="space-y-3 mb-6">
                {items.map(item => (
                  <div key={item.product_id} className="flex justify-between text-sm text-gray-800 border-b border-gray-100 pb-2">
                    <div>
                      <span className="font-semibold">{item.quantity}x {item.product_name}</span>
                      {/* Tampilkan add-on di struk tagihan jika ada */}
                      {item.addons && item.addons.length > 0 && (
                        <div className="text-xs text-gray-500 mt-1">
                          {item.addons.map(a => `+ ${a.name}`).join(', ')}
                        </div>
                      )}
                    </div>
                    <span className="font-semibold text-right">Rp {item.subtotal.toLocaleString('id-ID')}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-200 pt-4 space-y-2 text-sm text-gray-700">
                <div className="flex justify-between"><span>Subtotal</span><span>Rp {subtotal.toLocaleString('id-ID')}</span></div>
                <div className="flex justify-between"><span>Pajak (11%)</span><span>Rp {tax_amount.toLocaleString('id-ID')}</span></div>
                <div className="flex justify-between text-xl font-bold pt-4 text-gray-900">
                  <span>Total</span><span className="text-blue-600">Rp {grand_total.toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>

            {/* Kanan: Pembayaran (Tanpa Tunai) */}
            <div className="w-7/12 p-6 flex flex-col relative bg-white">
              <button onClick={() => { setIsCheckoutOpen(false); setIsProcessing(false); setPaymentMethod(""); }} className="absolute top-4 right-4 text-gray-400 hover:text-gray-800"><X className="w-6 h-6" /></button>

              <h2 className="text-xl font-bold mb-4 text-gray-900">Metode Pembayaran</h2>

              {!isProcessing ? (
                <div className="flex flex-col h-full">
                  {/* Grid diubah jadi 3 kolom agar pas (QRIS, E-Wallet, Debit) */}
                  <div className="grid grid-cols-3 gap-3 mb-6">
                    <button onClick={() => { setPaymentMethod('qris'); setSelectedSubMethod('QRIS'); }} className={`p-3 border rounded-xl flex flex-col items-center justify-center gap-2 ${paymentMethod === 'qris' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:bg-gray-50'}`}>
                      <QrCode className="w-6 h-6"/> <span className="font-semibold text-sm">QRIS</span>
                    </button>
                    <button onClick={() => { setPaymentMethod('ewallet'); setSelectedSubMethod(''); }} className={`p-3 border rounded-xl flex flex-col items-center justify-center gap-2 ${paymentMethod === 'ewallet' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:bg-gray-50'}`}>
                      <Smartphone className="w-6 h-6"/> <span className="font-semibold text-sm">E-Wallet</span>
                    </button>
                    <button onClick={() => { setPaymentMethod('debit'); setSelectedSubMethod(''); }} className={`p-3 border rounded-xl flex flex-col items-center justify-center gap-2 ${paymentMethod === 'debit' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:bg-gray-50'}`}>
                      <CreditCard className="w-6 h-6"/> <span className="font-semibold text-sm">Debit / VA</span>
                    </button>
                  </div>

                  {/* Sub-menu Dinamis Tergantung Pilihan */}
                  <div className="flex-1">
                    {paymentMethod === 'ewallet' && (
                      <div className="grid grid-cols-2 gap-2 animate-in fade-in">
                        {['DANA', 'OVO', 'GoPay', 'ShopeePay'].map(ewallet => (
                          <button key={ewallet} onClick={() => setSelectedSubMethod(ewallet)} className={`p-3 border rounded-lg text-sm ${selectedSubMethod === ewallet ? 'border-blue-500 bg-blue-50 font-bold text-blue-700 shadow-sm' : 'hover:bg-gray-50'}`}>{ewallet}</button>
                        ))}
                      </div>
                    )}
                    {paymentMethod === 'debit' && (
                      <div className="grid grid-cols-2 gap-2 animate-in fade-in">
                        {['BCA', 'Mandiri', 'BNI', 'BRI'].map(bank => (
                          <button key={bank} onClick={() => setSelectedSubMethod(bank)} className={`p-3 border rounded-lg text-sm ${selectedSubMethod === bank ? 'border-blue-500 bg-blue-50 font-bold text-blue-700 shadow-sm' : 'hover:bg-gray-50'}`}>{bank}</button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Tombol Proses (Disable jika belum ada yang dipilih) */}
                  <button 
                    onClick={() => {
                      if (!paymentMethod) return alert("Pilih metode pembayaran dulu!");
                      setIsProcessing(true);
                    }} 
                    disabled={!paymentMethod || (paymentMethod !== 'qris' && !selectedSubMethod)}
                    className="w-full py-4 mt-4 bg-green-600 text-white rounded-xl font-bold text-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    Proses Tagihan
                  </button>
                </div>
              ) : (
                /* TAMPILAN SAAT DIPROSES (Simulasi QRIS / Virtual Account) */
                <div className="flex flex-col items-center justify-center h-full text-center animate-in fade-in zoom-in">
                  {paymentMethod === 'qris' || paymentMethod === 'ewallet' ? (
                    <>
                      <h3 className="font-bold text-xl mb-2 text-gray-900">Scan untuk Membayar</h3>
                      <p className="text-gray-500 mb-4 text-sm">Via {selectedSubMethod}</p>
                      <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=DUMMY_PAYMENT_${grand_total}`} alt="QR Code" className="w-40 h-40 mb-6 border p-2 rounded-xl bg-white shadow-sm" />
                    </>
                  ) : (
                    <>
                      <h3 className="font-bold text-xl mb-2 text-gray-900">Transfer Virtual Account</h3>
                      <p className="text-gray-500 mb-4 text-sm">Bank {selectedSubMethod}</p>
                      <div className="text-2xl font-mono bg-gray-100 px-6 py-4 rounded-lg mb-6 border border-gray-200 shadow-inner">1234 5678 9012</div>
                    </>
                  )}

                  <button onClick={selesaikanPesanan} className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-md">Simulasi: Anggap Sudah Dibayar</button>
                  <button onClick={() => setIsProcessing(false)} className="w-full py-3 mt-2 text-gray-500 font-semibold hover:text-gray-800">Batal / Kembali</button>
                </div>
              )}
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
}