"use client";

import React, { useState, useEffect } from 'react';
import { dbLocal, LocalProduct, LocalSale, OperationalExpense, DynamicCategory } from '@/lib/dbLocal';
import { LayoutDashboard, FileSpreadsheet, FileText, Store, Calendar, Search, DollarSign, Plus, Trash2, Tag, Upload, Key, ShieldCheck } from 'lucide-react';
// import * as XLSX from 'xlsx'; // Removed as it was unused

export default function DashboardPage() {
  const [products, setProducts] = useState<LocalProduct[]>([]);
  const [allSales, setAllSales] = useState<LocalSale[]>([]);
  const [filteredSales, setFilteredSales] = useState<LocalSale[]>([]);
  const [expenses, setExpenses] = useState<OperationalExpense[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<OperationalExpense[]>([]);
  const [categories, setCategories] = useState<DynamicCategory[]>([]);
  
  // Filter Kalender Tanggal Custom
  const [startDate, setStartDate] = useState<string>('2026-06-01');
  const [endDate, setEndDate] = useState<string>('2026-06-25');
  
  // State Input Form Biaya Operasional
  const [expenseType, setExpenseType] = useState<'Gaji Karyawan' | 'Listrik & Air' | 'Internet' | 'BBM & Transportasi' | 'Lainnya'>('Listrik & Air');
  const [expenseAmount, setExpenseAmount] = useState<number | ''>('');
  const [expenseNote, setExpenseNote] = useState('');

  // STATUS LISENSI (BRD Hak Akses & Pembatasan Fitur)
  const [isPremiumUnlocked, setIsPremiumUnlocked] = useState(false);
  const [licenseKeyInput, setLicenseKeyInput] = useState('');

  // PIN RAHASIA UNTUK UNLOCK WHITE-LABEL (Hanya Anda yang Tahu)
  const LISENSI_PREMIUM_SAKTI = "9988"; 

  // Merek Toko Dinamis
  const [shopName, setShopName] = useState('SISUKA ERP');
  const [logoUrl, setLogoUrl] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');

  // State Keuangan Akuntansi
  const [totalAset, setTotalAset] = useState(0);
  const [totalOmzetPenjualan, setTotalOmzetPenjualan] = useState(0);
  const [totalHargaBeliModal, setTotalHargaBeliModal] = useState(0); 
  const [totalBiayaOperasional, setTotalBiayaOperasional] = useState(0); 
  const [totalLabaBersih, setTotalLabaBersih] = useState(0);       
  const [totalStokFisik, setTotalStokFisik] = useState(0);

  useEffect(() => {
    loadBaseData();
  }, []);

  const loadBaseData = async () => {
    const dataProduk = await dbLocal.products.toArray();
    const dataPenjualan = await dbLocal.sales.toArray();
    const dataBiaya = await dbLocal.expenses.toArray();
    const dataKategori = await dbLocal.categories.toArray();
    
    setProducts(dataProduk);
    setAllSales(dataPenjualan);
    setExpenses(dataBiaya);
    setCategories(dataKategori);

    const aset = dataProduk.reduce((sum, p) => sum + (p.stock * (p.purchasePrice || 0)), 0);
    const stok = dataProduk.reduce((sum, p) => sum + p.stock, 0);
    setTotalAset(aset);
    setTotalStokFisik(stok);

    // Cek apakah user sudah pernah mengaktifkan premium sebelumnya
    const savedConfig = await dbLocal.config.get('shop_settings');
    if (savedConfig) {
      if (savedConfig.isPremium) {
        setIsPremiumUnlocked(true);
        setShopName(savedConfig.shopName || 'SISUKA ERP');
      } else {
        // Jika paket standar, paksa nama terkunci di SISUKA ERP
        setShopName('SISUKA ERP');
      }
      setLogoUrl(savedConfig.logoBase64 || '');
    } else {
      // Default instalasi awal: Paket Standar SISUKA ERP
      await dbLocal.config.put({ id: 'shop_settings', shopName: 'SISUKA ERP', logoBase64: '', isPremium: false } as any);
    }
  };

  const handleCalculateFinance = () => {
    if (!startDate || !endDate) return;
    const startTimestamp = new Date(`${startDate}T00:00:00`).getTime();
    const endTimestamp = new Date(`${endDate}T23:59:59`).getTime();

    const filterJualan = allSales.filter(sale => sale.timestamp >= startTimestamp && sale.timestamp <= endTimestamp);
    setFilteredSales(filterJualan);

    const filterBiaya = expenses.filter(exp => exp.timestamp >= startTimestamp && exp.timestamp <= endTimestamp);
    setFilteredExpenses(filterBiaya);

    const omzet = filterJualan.reduce((sum, sale) => sum + sale.totalPrice, 0);
    setTotalOmzetPenjualan(omzet);

    let totalModalTerjual = 0;
    filterJualan.forEach(sale => {
      if (sale.items) {
        sale.items.forEach(item => { totalModalTerjual += ((item.purchasePrice || 0) * item.quantity); });
      }
    });
    setTotalHargaBeliModal(totalModalTerjual);

    const totalBiaya = filterBiaya.reduce((sum, exp) => sum + exp.amount, 0);
    setTotalBiayaOperasional(totalBiaya);

    setTotalLabaBersih(omzet - totalModalTerjual - totalBiaya);
  };

  useEffect(() => {
    handleCalculateFinance();
  }, [allSales, expenses, startDate, endDate]);

  // FUNGSI AKTIVASI LISENSI MANDIRI OLEH USER
  const handleActivateLicense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (licenseKeyInput === LISENSI_PREMIUM_SAKTI) {
      setIsPremiumUnlocked(true);
      await dbLocal.config.update('shop_settings', { isPremium: true });
      alert('🎉 SELAMAT! Kode Aktivasi Valid. Fitur Premium White-Label Toko Anda Resmi Aktif!');
      loadBaseData();
    } else {
      alert('❌ Kode Aktivasi Salah! Silakan hubungi Developer untuk membeli Lisensi Resmi.');
      setLicenseKeyInput('');
    }
  };

  const handleSaveShopName = async () => {
    if (!shopName.trim()) return alert('Nama tidak boleh kosong!');
    await dbLocal.config.update('shop_settings', { shopName: shopName.trim() });
    alert('Merek Toko Berhasil Dikunci!');
    loadBaseData();
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      setLogoUrl(base64String);
      await dbLocal.config.update('shop_settings', { logoBase64: base64String });
      alert('Logo Toko Berhasil Dipasang!');
    };
    reader.readAsDataURL(file);
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    await dbLocal.categories.add({ id: `cat-${Date.now()}`, name: newCategoryName.trim() });
    setNewCategoryName(''); loadBaseData();
  };

  const handleDeleteCategory = async (id: string) => {
    await dbLocal.categories.delete(id); loadBaseData();
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseAmount) return;
    await dbLocal.expenses.add({ id: `EXP-${Date.now()}`, timestamp: Date.now(), type: expenseType, amount: Number(expenseAmount), note: expenseNote });
    setExpenseAmount(''); setExpenseNote(''); loadBaseData();
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-6 font-sans print:bg-white print:p-0">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER UTAMA */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 print:hidden">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-600 text-white p-2.5 rounded-xl shadow-md"><Store className="w-6 h-6" /></div>
            <div>
              <h1 className="text-2xl font-black text-emerald-800 uppercase tracking-tight">{shopName}</h1>
              <p className="text-xs text-gray-400 font-bold">Modul Analisis Finansial & Pusat Pengendali Lisensi ERP</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => window.print()} className="bg-white hover:bg-gray-100 text-blue-700 font-bold text-xs px-4 py-2 rounded-xl border shadow-sm flex items-center gap-1.5"><FileText className="w-4 h-4" /> PRINT PDF</button>
          </div>
        </div>

        {/* KONDISI 1: JIKA SUDAH PREMIUM -> MUNCULKAN FORM GANTI NAMA & LOGO (WHITE-LABEL) */}
        {isPremiumUnlocked ? (
          <div className="bg-white p-4 rounded-2xl border-2 border-emerald-300 shadow-sm mb-6 flex flex-col md:flex-row items-center justify-between gap-4 print:hidden">
            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="w-14 h-14 rounded-full border border-gray-300 bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                {logoUrl ? <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" /> : <Store className="text-gray-400 w-6 h-6" />}
              </div>
              <div className="w-full">
                <div className="flex items-center gap-1.5 text-[10px] font-black text-emerald-600 uppercase mb-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> FITUR PREMIUM LISENSI WHITE-LABEL AKTIF
                </div>
                <div className="flex gap-2">
                  <input type="text" value={shopName} onChange={(e) => setShopName(e.target.value)} className="bg-gray-50 border border-gray-300 text-sm rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-emerald-500 outline-none w-full md:w-64 font-bold text-emerald-800" />
                  <button onClick={handleSaveShopName} className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-4 rounded-lg transition">SIMPAN</button>
                </div>
              </div>
            </div>
            <label className="bg-white hover:bg-gray-100 text-gray-700 font-bold py-2 px-4 rounded-xl border border-gray-300 text-xs cursor-pointer flex items-center gap-2 w-full md:w-auto justify-center">
              <Upload className="w-4 h-4 text-emerald-600" /> UBAH LOGO TOKO
              <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
            </label>
          </div>
        ) : (
          // KONDISI 2: JIKA BELUM PREMIUM (PAKET STANDAR) -> TAMPILKAN KOTAK INPUT KODE AKTIVASI
          <div className="bg-red-50 p-4 rounded-2xl border-2 border-red-200 shadow-sm mb-6 flex flex-col md:flex-row items-center justify-between gap-4 print:hidden">
            <div className="flex items-center gap-3">
              <div className="bg-red-100 p-2 rounded-full text-red-600">
                <Key className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-red-800">Paket Standar (Terkunci)</h3>
                <p className="text-xs text-red-600">Masukkan PIN Aktivasi untuk membuka fitur White-Label.</p>
              </div>
            </div>
            <form onSubmit={handleActivateLicense} className="flex gap-2 w-full md:w-auto">
              <input 
                type="password" 
                placeholder="Masukkan PIN..." 
                value={licenseKeyInput} 
                onChange={(e) => setLicenseKeyInput(e.target.value)} 
                className="bg-white border border-red-300 text-sm rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-red-500 outline-none w-full md:w-48 font-bold text-red-800" 
              />
              <button type="submit" className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-4 rounded-lg transition">AKTIVASI</button>
            </form>
          </div>
        )}

        {/* KONTEN DASHBOARD UTAMA */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div key="total-aset" className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 text-gray-500 mb-2"><DollarSign className="w-4 h-4" /> <span className="text-xs font-bold">TOTAL ASET PRODUK</span></div>
            <div className="text-xl font-black text-gray-800">Rp {totalAset.toLocaleString('id-ID')}</div>
          </div>
          <div key="total-stok" className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 text-gray-500 mb-2"><LayoutDashboard className="w-4 h-4" /> <span className="text-xs font-bold">TOTAL STOK FISIK</span></div>
            <div className="text-xl font-black text-gray-800">{totalStokFisik.toLocaleString('id-ID')} Unit</div>
          </div>
          <div key="total-penjualan" className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 text-gray-500 mb-2"><FileSpreadsheet className="w-4 h-4" /> <span className="text-xs font-bold">TOTAL PENJUALAN</span></div>
            <div className="text-xl font-black text-gray-800">{allSales.length} Transaksi</div>
          </div>
          <div key="kategori-produk" className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 text-gray-500 mb-2"><Tag className="w-4 h-4" /> <span className="text-xs font-bold">KATEGORI PRODUK</span></div>
            <div className="text-xl font-black text-gray-800">{categories.length} Kategori</div>
          </div>
        </div>

      </div>
    </div>
  );
}