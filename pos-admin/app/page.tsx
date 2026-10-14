"use client";
import { useState, useEffect } from 'react';
import { LayoutDashboard, Package, Users, ReceiptText, Settings, LogOut, TrendingUp, DollarSign, ShoppingBag, Plus, Edit, Trash2, X, Layers } from 'lucide-react';

export default function AdminDashboard() {
  const [activeMenu, setActiveMenu] = useState('dashboard'); 
  
  // States data
  const [stats, setStats] = useState({ revenue: 0, transactions: 0 });
  const [products, setProducts] = useState<any[]>([]);
  const [transactionsData, setTransactionsData] = useState<any[]>([]);
  const [addonsData, setAddonsData] = useState<any[]>([]); // State baru untuk data Add-on
  const [isLoading, setIsLoading] = useState(true);

  // States form produk
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({ sku: '', name: '', base_price: '', selling_price: '' });

  // States form Add-on (BARU)
  const [isAddAddonModalOpen, setIsAddAddonModalOpen] = useState(false);
  const [addonFormData, setAddonFormData] = useState({ product_id: '', name: '', price: '' });

  // 1. MENGINGAT MENU TERAKHIR SAAT REFRESH
  useEffect(() => {
    const savedMenu = localStorage.getItem('adminActiveMenu');
    if (savedMenu) setActiveMenu(savedMenu);
  }, []);

  const changeMenu = (menuId: string) => {
    setActiveMenu(menuId);
    localStorage.setItem('adminActiveMenu', menuId); // Simpan pilihan bos ke browser
  };

  // 2. FUNGSI TARIK SEMUA DATA (Ditambah fetch addons)
  const fetchData = async () => {
    try {
      const [resStats, resProd, resTrans, resAddons] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/products'),
        fetch('/api/admin/transactions'),
        fetch('/api/admin/addons') // Tarik data add-on
      ]);

      const dataStats = await resStats.json();
      const dataProd = await resProd.json();
      const dataTrans = await resTrans.json();
      const dataAddons = await resAddons.json();

      setStats({ revenue: dataStats.totalRevenue || 0, transactions: dataStats.totalTransactions || 0 });
      setProducts(Array.isArray(dataProd) ? dataProd : []);
      setTransactionsData(Array.isArray(dataTrans) ? dataTrans : []);
      setAddonsData(Array.isArray(dataAddons) ? dataAddons : []);
    } catch (error) {
      console.error(error);
    }
  };

  // 3. AUTO-UPDATE (POLLING) SETIAP 5 DETIK TANPA REFRESH
  useEffect(() => {
    fetchData(); // Tarikan pertama
    setIsLoading(false);

    // Bikin interval agar fetch berulang tiap 5 detik (5000 ms) di background
    const interval = setInterval(() => {
      fetchData();
    }, 5000);

    return () => clearInterval(interval); // Bersihkan jika halaman ditutup
  }, []);

  // Submit Produk
  const handleSubmitProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setIsAddModalOpen(false);
        setFormData({ sku: '', name: '', base_price: '', selling_price: '' });
        fetchData();
        alert("Produk berhasil ditambahkan!");
      } else {
        const errData = await res.json();
        alert("GAGAL MENYIMPAN:\n" + errData.error);
      }
    } catch (error) {
      console.error(error);
    }
    setIsSaving(false);
  };

  // Submit Add-on (BARU)
  const handleSubmitAddon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addonFormData.product_id) return alert("Pilih produknya terlebih dahulu!");

    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/addons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addonFormData)
      });
      if (res.ok) {
        setIsAddAddonModalOpen(false);
        setAddonFormData({ product_id: '', name: '', price: '' });
        fetchData();
        alert("Add-on berhasil ditambahkan!");
      } else {
        const errData = await res.json();
        alert("GAGAL MENYIMPAN ADD-ON:\n" + errData.error);
      }
    } catch (error) {
      console.error(error);
    }
    setIsSaving(false);
  };

  // Menu Sidebar (Ditambah Manajemen Add-on)
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'products', label: 'Manajemen Produk', icon: <Package className="w-5 h-5" /> },
    { id: 'addons', label: 'Manajemen Add-on', icon: <Layers className="w-5 h-5" /> }, // Menu Baru
    { id: 'transactions', label: 'Laporan Transaksi', icon: <ReceiptText className="w-5 h-5" /> },
  ];

  return (
    <div className="flex h-screen bg-gray-100 font-sans text-gray-900 relative">
      {/* SIDEBAR */}
      <div className="w-64 bg-slate-900 text-white flex flex-col shadow-2xl z-20">
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center font-bold text-xl">B</div>
          <span className="text-xl font-bold tracking-wider">ADMIN PANEL</span>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((menu) => (
            <button key={menu.id} onClick={() => changeMenu(menu.id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeMenu === menu.id ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
              {menu.icon} <span className="font-medium">{menu.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="bg-white px-8 py-5 shadow-sm z-10 flex justify-between items-center border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-800 capitalize">{menuItems.find(m => m.id === activeMenu)?.label}</h1>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            Live Update Aktif
          </div>
        </header>

        <main className="flex-1 p-8 overflow-y-auto">
          {isLoading ? (
            <div className="h-full flex items-center justify-center text-gray-500 font-semibold animate-pulse">Memuat Data...</div>
          ) : (
            <>
              {/* ===================== MENU DASHBOARD ===================== */}
              {activeMenu === 'dashboard' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex items-center gap-4 transition-all">
                    <div className="p-4 bg-green-100 text-green-600 rounded-xl"><DollarSign className="w-8 h-8" /></div>
                    <div>
                      <p className="text-sm font-semibold text-gray-500">Total Pendapatan</p>
                      <h3 className="text-2xl font-bold text-gray-800">Rp {stats.revenue.toLocaleString('id-ID')}</h3>
                    </div>
                  </div>
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex items-center gap-4">
                    <div className="p-4 bg-blue-100 text-blue-600 rounded-xl"><ReceiptText className="w-8 h-8" /></div>
                    <div>
                      <p className="text-sm font-semibold text-gray-500">Total Transaksi</p>
                      <h3 className="text-2xl font-bold text-gray-800">{stats.transactions} Invoice</h3>
                    </div>
                  </div>
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex items-center gap-4">
                    <div className="p-4 bg-purple-100 text-purple-600 rounded-xl"><Package className="w-8 h-8" /></div>
                    <div>
                      <p className="text-sm font-semibold text-gray-500">Total Macam Produk</p>
                      <h3 className="text-xl font-bold text-gray-800">{products.length} Produk</h3>
                    </div>
                  </div>
                </div>
              )}

              {/* ===================== MENU LAPORAN TRANSAKSI ===================== */}
              {activeMenu === 'transactions' && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-6">Riwayat Transaksi Terbaru</h2>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50 text-gray-500 text-sm border-y border-gray-200">
                          <th className="p-4 font-semibold">Tanggal & Waktu</th>
                          <th className="p-4 font-semibold">Nomor Invoice</th>
                          <th className="p-4 font-semibold">Kasir</th>
                          <th className="p-4 font-semibold">Metode Bayar</th>
                          <th className="p-4 font-semibold text-right">Total Tagihan (Rp)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactionsData.length === 0 ? (
                          <tr><td colSpan={5} className="p-8 text-center text-gray-500">Belum ada transaksi sama sekali.</td></tr>
                        ) : (
                          transactionsData.map((trx, index) => (
                            <tr key={trx.id} className={`border-b border-gray-100 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} hover:bg-blue-50`}>
                              <td className="p-4 text-gray-500 text-sm">
                                {new Date(trx.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                              </td>
                              <td className="p-4 font-bold text-blue-600">{trx.invoice_number}</td>
                              <td className="p-4 text-gray-700">{trx.user?.name || 'Kasir'}</td>
                              <td className="p-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                                  trx.transaction_payments[0]?.payment_method === 'qris' ? 'bg-blue-100 text-blue-700' :
                                  trx.transaction_payments[0]?.payment_method === 'cash' ? 'bg-green-100 text-green-700' :
                                  'bg-orange-100 text-orange-700'
                                }`}>
                                  {trx.transaction_payments[0]?.payment_method || '-'}
                                </span>
                              </td>
                              <td className="p-4 text-right font-bold text-gray-900">
                                {Number(trx.grand_total).toLocaleString('id-ID')}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ===================== MENU MANAJEMEN PRODUK ===================== */}
              {activeMenu === 'products' && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-800">Daftar Produk Toko</h2>
                    <button onClick={() => setIsAddModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors">
                      <Plus className="w-4 h-4" /> Tambah Produk
                    </button>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50 text-gray-500 text-sm border-y border-gray-200">
                          <th className="p-4 font-semibold">SKU</th>
                          <th className="p-4 font-semibold">Nama Produk</th>
                          <th className="p-4 font-semibold">Harga Modal</th>
                          <th className="p-4 font-semibold">Harga Jual</th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.length === 0 ? (
                          <tr><td colSpan={4} className="p-8 text-center text-gray-500">Belum ada produk.</td></tr>
                        ) : (
                          products.map((p, index) => (
                            <tr key={p.id} className={`border-b border-gray-100 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                              <td className="p-4 text-gray-500 font-medium text-sm">{p.sku}</td>
                              <td className="p-4 font-bold text-gray-800">{p.name}</td>
                              <td className="p-4 text-gray-600">Rp {Number(p.base_price).toLocaleString('id-ID')}</td>
                              <td className="p-4 text-blue-600 font-bold">Rp {Number(p.selling_price).toLocaleString('id-ID')}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ===================== MENU MANAJEMEN ADD-ON (BARU) ===================== */}
              {activeMenu === 'addons' && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-800">Daftar Add-on (Modifier)</h2>
                    <button onClick={() => setIsAddAddonModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors">
                      <Plus className="w-4 h-4" /> Tambah Add-on
                    </button>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50 text-gray-500 text-sm border-y border-gray-200">
                          <th className="p-4 font-semibold">Nama Add-on</th>
                          <th className="p-4 font-semibold">Harga Tambahan</th>
                          <th className="p-4 font-semibold">Berlaku Untuk Produk</th>
                        </tr>
                      </thead>
                      <tbody>
                        {addonsData.length === 0 ? (
                          <tr><td colSpan={3} className="p-8 text-center text-gray-500">Belum ada Add-on. Klik "Tambah Add-on".</td></tr>
                        ) : (
                          addonsData.map((addon, index) => (
                            <tr key={addon.id} className={`border-b border-gray-100 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                              <td className="p-4 font-bold text-gray-800">{addon.name}</td>
                              <td className="p-4 text-blue-600 font-bold">
                                {Number(addon.price) === 0 ? 'Gratis' : `+Rp ${Number(addon.price).toLocaleString('id-ID')}`}
                              </td>
                              <td className="p-4 text-gray-600">
                                <span className="bg-gray-200 px-3 py-1 rounded-full text-xs font-semibold">{addon.product?.name || 'Semua Produk'}</span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* ================= MODAL TAMBAH PRODUK ================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white w-[500px] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h2 className="text-xl font-bold text-gray-900">Tambah Produk Baru</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-800"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmitProduct} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Kode SKU</label>
                <input type="text" required className="w-full p-3 bg-gray-50 border rounded-lg focus:ring-2 focus:ring-blue-500" value={formData.sku} onChange={(e) => setFormData({...formData, sku: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Nama Produk</label>
                <input type="text" required className="w-full p-3 bg-gray-50 border rounded-lg focus:ring-2 focus:ring-blue-500" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Harga Modal</label>
                  <input type="number" required className="w-full p-3 bg-gray-50 border rounded-lg focus:ring-2 focus:ring-blue-500" value={formData.base_price} onChange={(e) => setFormData({...formData, base_price: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Harga Jual</label>
                  <input type="number" required className="w-full p-3 bg-gray-50 border rounded-lg focus:ring-2 focus:ring-blue-500" value={formData.selling_price} onChange={(e) => setFormData({...formData, selling_price: e.target.value})} />
                </div>
              </div>
              <div className="pt-4 mt-6 border-t border-gray-200 flex justify-end gap-3">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg">Batal</button>
                <button type="submit" disabled={isSaving} className="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-lg">{isSaving ? 'Menyimpan...' : 'Simpan'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL TAMBAH ADD-ON (BARU) ================= */}
      {isAddAddonModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white w-[500px] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h2 className="text-xl font-bold text-gray-900">Tambah Add-on</h2>
              <button onClick={() => setIsAddAddonModalOpen(false)} className="text-gray-400 hover:text-gray-800"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmitAddon} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Berlaku Untuk Produk Mana?</label>
                <select 
                  required
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={addonFormData.product_id} 
                  onChange={(e) => setAddonFormData({...addonFormData, product_id: e.target.value})}
                >
                  <option value="">-- Pilih Produk --</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Nama Add-on / Modifier</label>
                <input type="text" required placeholder="Contoh: Extra Shot, Less Sugar, Topping" className="w-full p-3 bg-gray-50 border rounded-lg focus:ring-2 focus:ring-blue-500" value={addonFormData.name} onChange={(e) => setAddonFormData({...addonFormData, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Harga Tambahan (Isi 0 jika gratis)</label>
                <input type="number" required placeholder="0" className="w-full p-3 bg-gray-50 border rounded-lg focus:ring-2 focus:ring-blue-500" value={addonFormData.price} onChange={(e) => setAddonFormData({...addonFormData, price: e.target.value})} />
              </div>
              <div className="pt-4 mt-6 border-t border-gray-200 flex justify-end gap-3">
                <button type="button" onClick={() => setIsAddAddonModalOpen(false)} className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg">Batal</button>
                <button type="submit" disabled={isSaving} className="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-lg">{isSaving ? 'Menyimpan...' : 'Simpan Add-on'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}