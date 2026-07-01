"use client";

import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import Link from 'next/link';
import { dbLocal } from '@/lib/dbLocal';
import { Landmark, FileText, Store, Plus, Trash2, Tag, Upload, ShieldCheck, Key, Users, Receipt, DollarSign } from 'lucide-react';

// === TIPE DATA ===
interface Product {
  id: string;
  name: string;
  stock: number;
  purchasePrice?: number;
  sellingPrice?: number;
  category?: string;
}

// === TIPE DATA ===
interface SaleItem {
  productId: string;   // ← sesuai dengan LocalSale
  name: string;
  quantity: number;
  price: number;
  purchasePrice: number;
  units: string;
}

interface Sale {
  id: string;
  timestamp: number;
  totalPrice: number;
  items: SaleItem[];
  paymentMethod?: string;
}

interface Expense {
  id: string;
  timestamp: number;
  type: string;
  amount: number;
  note?: string;
}

interface Category {
  id: string;
  name: string;
}

interface ShopConfig {
  id: string;
  shopName: string;
  logoBase64: string;
  isPremium: boolean;
}

export default function DashboardPage() {
  // === STATE ===
  const [products, setProducts] = useState<Product[]>([]);
  const [allSales, setAllSales] = useState<Sale[]>([]);
  const [filteredSales, setFilteredSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // AUTO DETEKSI KALENDER: Juni 2026
  const [startDate, setStartDate] = useState<string>('2026-06-01');
  const [endDate, setEndDate] = useState<string>('2026-06-30');
  
  // MODUL HRD & OPERASIONAL
  const [expenseType, setExpenseType] = useState<'Gaji Karyawan' | 'Listrik & Air' | 'Internet' | 'BBM & Transportasi' | 'Lainnya'>('Gaji Karyawan');
  const [expenseAmount, setExpenseAmount] = useState<number | ''>('');
  const [expenseNote, setExpenseNote] = useState<string>('');

  // STATUS LISENSI
  const [isPremiumUnlocked, setIsPremiumUnlocked] = useState<boolean>(false);
  const [showSecretLicenseModal, setShowSecretLicenseModal] = useState<boolean>(false); 
  const [licenseKeyInput, setLicenseKeyInput] = useState<string>('');
  const LISENSI_PREMIUM_SAKTI = "9988"; 

  // MEREK TOKO
  const [shopName, setShopName] = useState<string>('SISUKA ERP');
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [newCategoryName, setNewCategoryName] = useState<string>('');

  // KEUANGAN
  const [totalAset, setTotalAset] = useState<number>(0);
  const [totalOmzetPenjualan, setTotalOmzetPenjualan] = useState<number>(0);
  const [totalHargaBeliModal, setTotalHargaBeliModal] = useState<number>(0); 
  const [totalBiayaOperasional, setTotalBiayaOperasional] = useState<number>(0); 
  const [totalLabaBersih, setTotalLabaBersih] = useState<number>(0);       
  const [totalStokFisik, setTotalStokFisik] = useState<number>(0);

  // === EFFECT ===
  useEffect(() => {
    loadBaseData();
  }, []);

  // === LOAD DATA ===
  const loadBaseData = async (): Promise<void> => {
    try {
      const dataProduk = await dbLocal.products.toArray();
      const dataPenjualan = await dbLocal.sales.toArray();
      const dataBiaya = await dbLocal.expenses.toArray();
      const dataKategori = await dbLocal.categories.toArray();
      
      setProducts(dataProduk);
      setAllSales(dataPenjualan as any);
      setExpenses(dataBiaya);
      setCategories(dataKategori);

      // Hitung aset
      const aset = dataProduk.reduce((sum: number, p: Product) => sum + (p.stock * (p.purchasePrice || 0)), 0);
      const stok = dataProduk.reduce((sum: number, p: Product) => sum + p.stock, 0);
      setTotalAset(aset);
      setTotalStokFisik(stok);

      // Load konfigurasi toko
      const savedConfig = await dbLocal.config.get('shop_settings') as ShopConfig | undefined;
      if (savedConfig) {
        if (savedConfig.isPremium) {
          setIsPremiumUnlocked(true);
          setShopName(savedConfig.shopName || 'SISUKA ERP');
        } else {
          setShopName('SISUKA ERP');
        }
        setLogoUrl(savedConfig.logoBase64 || '');
      } else {
        // Buat default config
        await dbLocal.config.put({ 
          id: 'shop_settings', 
          shopName: 'SISUKA ERP', 
          logoBase64: '', 
          isPremium: false 
        });
      }
    } catch (err) {
      console.error("Gagal memuat data master:", err);
    }
  };

  // === FILTER KEUANGAN ===
  const handleCalculateFinance = (): void => {
    if (!startDate || !endDate) return;
    
    const startTimestamp = new Date(`${startDate}T00:00:00`).getTime();
    const endTimestamp = new Date(`${endDate}T23:59:59`).getTime();

    const filterJualan = allSales.filter((sale: Sale) => sale.timestamp >= startTimestamp && sale.timestamp <= endTimestamp);
    setFilteredSales(filterJualan);

    const filterBiaya = expenses.filter((exp: Expense) => exp.timestamp >= startTimestamp && exp.timestamp <= endTimestamp);
    setFilteredExpenses(filterBiaya);

    // Hitung omzet
    const omzet = filterJualan.reduce((sum: number, sale: Sale) => sum + sale.totalPrice, 0);
    setTotalOmzetPenjualan(omzet);

    // Hitung modal barang terjual
    let totalModalTerjual = 0;
    filterJualan.forEach((sale: Sale) => {
      if (sale.items) {
        sale.items.forEach((item: SaleItem) => { 
          totalModalTerjual += ((item.purchasePrice || 0) * item.quantity); 
        });
      }
    });
    setTotalHargaBeliModal(totalModalTerjual);

    // Total biaya operasional
    const totalBiaya = filterBiaya.reduce((sum: number, exp: Expense) => sum + exp.amount, 0);
    setTotalBiayaOperasional(totalBiaya);

    // Laba bersih
    setTotalLabaBersih(omzet - totalModalTerjual - totalBiaya);
  };

  // Re-kalkulasi ketika data berubah
  useEffect(() => {
    handleCalculateFinance();
  }, [allSales, expenses, startDate, endDate]);

  // === HANDLER LISENSI ===
  const handleActivateLicense = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (licenseKeyInput === LISENSI_PREMIUM_SAKTI) {
      setIsPremiumUnlocked(true);
      await dbLocal.config.update('shop_settings', { isPremium: true });
      setShowSecretLicenseModal(false);
      alert('🎉 UPGRADE BERHASIL! Lisensi Premium White-Label Aktif!');
      await loadBaseData();
    } else {
      alert('❌ Kode PIN Aktivasi Salah!');
      setLicenseKeyInput('');
    }
  };

  // === HANDLER MEREK TOKO ===
  const handleSaveShopName = async (): Promise<void> => {
    if (!shopName.trim()) return;
    await dbLocal.config.update('shop_settings', { shopName: shopName.trim() });
    alert('Merek Toko Berhasil Dikunci!'); 
    await loadBaseData();
  };

  // === HANDLER UPLOAD LOGO ===
  const handleLogoUpload = async (e: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = e.target.files?.[0]; 
    if (!file) return;
    
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      setLogoUrl(base64String);
      await dbLocal.config.update('shop_settings', { logoBase64: base64String });
      alert('Logo Toko Berhasil Dipasang!'); 
      await loadBaseData();
    };
    reader.readAsDataURL(file);
  };

  // === HANDLER KATEGORI ===
  const handleAddCategory = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    
    await dbLocal.categories.add({ 
      id: `cat-${Date.now()}`, 
      name: newCategoryName.trim() 
    });
    setNewCategoryName(''); 
    await loadBaseData();
  };

  const handleDeleteCategory = async (id: string): Promise<void> => {
    if (confirm('Hapus kategori ini?')) {
      await dbLocal.categories.delete(id); 
      await loadBaseData();
    }
  };

  // === HANDLER BIAYA OPERASIONAL ===
const handleAddExpense = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!expenseAmount || isNaN(Number(expenseAmount))) {
    alert('Nominal pengeluaran wajib diisi angka!');
    return;
  }

  const nominal = Number(expenseAmount);
  
  // ===== SIMPAN KE EXPENSES =====
  await dbLocal.expenses.add({ 
    id: `EXP-${Date.now()}`, 
    timestamp: Date.now(), 
    type: expenseType, 
    amount: nominal, 
    note: expenseNote 
  });

  // ===== 🔥 TAMBAHKAN: SIMPAN KE JURNAL BUKU BESAR =====
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Entry Debit (Beban)
    await dbLocal.jurnal?.add({
      id: `JRN-${Date.now()}`,
      tanggal: today,
      keterangan: `Biaya ${expenseType}`,
      akun: expenseType, // Misal: 'Beban Gaji', 'Beban Listrik & Air', dll
      debit: nominal,
      kredit: 0,
      ref: 'Kas',
      createdAt: Date.now()
    });

    // Entry Kredit (Kas)
    await dbLocal.jurnal?.add({
      id: `JRN-${Date.now()}-K`,
      tanggal: today,
      keterangan: `Biaya ${expenseType}`,
      akun: 'Kas',
      debit: 0,
      kredit: nominal,
      ref: expenseType,
      createdAt: Date.now()
    });

    console.log('✅ Jurnal biaya berhasil dicatat!');
  } catch (err) {
    console.error('Gagal menyimpan jurnal biaya:', err);
  }

  // ===== RESET FORM =====
  setExpenseAmount(''); 
  setExpenseNote(''); 
  await loadBaseData();
  alert('Catatan pengeluaran resmi dikunci ke dalam jurnal!');
};

  const handleDeleteExpense = async (id: string): Promise<void> => {
    if (confirm('Hapus log catatan pengeluaran ini?')) {
      await dbLocal.expenses.delete(id); 
      await loadBaseData();
    }
  };

  // === RENDER ===
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-6 font-sans print:bg-white print:p-0">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 print:hidden">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-600 text-white p-2.5 rounded-xl shadow-md">
              <Landmark className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-emerald-800 uppercase tracking-tight">{shopName}</h1>
              <p className="text-xs text-gray-400 font-bold">Pusat Akunting Terpadu & Satu Tab Laporan Finansial Komplit</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
    {/* TOMBOL LAPORAN - TAMBAHKAN INI */}
    <Link href="/laporan">
      <button className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5">
        <FileText className="w-4 h-4" /> LAPORAN
      </button>
    </Link>
    
    {!isPremiumUnlocked && (
      <button 
        type="button"
        onClick={() => setShowSecretLicenseModal(true)} 
        className="text-[10px] text-gray-300 hover:text-gray-400 font-medium tracking-widest uppercase px-2 py-1 border border-gray-200/50 rounded-md transition"
      >
        sys_v2.0
      </button>
    )}
    <button 
      type="button" 
      onClick={() => window.print()} 
      className="bg-white hover:bg-gray-100 text-blue-700 font-bold text-xs px-4 py-2 rounded-xl border shadow-sm flex items-center gap-1.5"
    >
      <FileText className="w-4 h-4" /> PRINT LAPORAN
    </button>
</div>
        </div>

        {/* WHITE LABEL PREMIUM */}
        {isPremiumUnlocked && (
          <div className="bg-white p-4 rounded-2xl border-2 border-emerald-300 shadow-sm mb-6 flex flex-col md:flex-row items-center justify-between gap-4 print:hidden">
            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="w-14 h-14 rounded-full border bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <Store className="text-gray-400 w-6 h-6" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-[10px] font-black text-emerald-600 mb-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> LISENSI PREMIUM WHITE-LABEL ACTIVE
                </div>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={shopName} 
                    onChange={(e) => setShopName(e.target.value)} 
                    className="bg-gray-50 border text-sm rounded-lg px-3 py-1 font-bold text-emerald-800 outline-none w-64" 
                  />
                  <button 
                    type="button" 
                    onClick={handleSaveShopName} 
                    className="bg-emerald-700 text-white font-bold text-xs px-3 rounded-lg"
                  >
                    SIMPAN MEREK
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

              {/* ===== STATISTIK DASHBOARD ===== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* KARTU OMZET */}
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gray-400 uppercase">Omzet Penjualan</span>
              <Receipt className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-2xl font-black text-gray-800">
              Rp {totalOmzetPenjualan.toLocaleString('id-ID')}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {filteredSales.length} transaksi
            </p>
          </div>

          {/* KARTU MODAL */}
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gray-400 uppercase">Modal HPP</span>
              <DollarSign className="w-5 h-5 text-orange-500" />
            </div>
            <p className="text-2xl font-black text-gray-800">
              Rp {totalHargaBeliModal.toLocaleString('id-ID')}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Harga Pokok Penjualan
            </p>
          </div>

          {/* KARTU BIAYA OPERASIONAL */}
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gray-400 uppercase">Biaya Operasional</span>
              <DollarSign className="w-5 h-5 text-red-500" />
            </div>
            <p className="text-2xl font-black text-gray-800">
              Rp {totalBiayaOperasional.toLocaleString('id-ID')}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {filteredExpenses.length} pengeluaran
            </p>
          </div>

          {/* KARTU LABA BERSIH */}
          <div className={`bg-white p-4 rounded-2xl shadow-sm border ${totalLabaBersih >= 0 ? 'border-emerald-300' : 'border-red-300'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gray-400 uppercase">Laba Bersih</span>
              <Landmark className={`w-5 h-5 ${totalLabaBersih >= 0 ? 'text-emerald-500' : 'text-red-500'}`} />
            </div>
            <p className={`text-2xl font-black ${totalLabaBersih >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              Rp {totalLabaBersih.toLocaleString('id-ID')}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {totalLabaBersih >= 0 ? '✅ Untung' : '❌ Rugi'}
            </p>
          </div>
        </div>

        {/* ===== RINGKASAN ASET & STOK ===== */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200">
            <h3 className="text-sm font-bold text-gray-600 mb-2">💰 Total Aset</h3>
            <p className="text-2xl font-black text-gray-800">
              Rp {totalAset.toLocaleString('id-ID')}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Nilai seluruh stok barang
            </p>
          </div>
          
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200">
            <h3 className="text-sm font-bold text-gray-600 mb-2">📦 Total Stok Fisik</h3>
            <p className="text-2xl font-black text-gray-800">
              {totalStokFisik.toLocaleString('id-ID')} unit
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {products.length} jenis produk
            </p>
          </div>
        </div>

        {/* ===== FILTER TANGGAL ===== */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-gray-600">📅 Periode:</span>
              <input 
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)} 
                className="border rounded-lg px-3 py-1.5 text-sm"
              />
              <span className="text-gray-400">→</span>
              <input 
                type="date" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)} 
                className="border rounded-lg px-3 py-1.5 text-sm"
              />
            </div>
            <button 
              type="button" 
              onClick={handleCalculateFinance} 
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-4 py-1.5 rounded-lg"
            >
              Hitung Ulang
            </button>
          </div>
        </div>

        {/* ===== FORM TAMBAH BIAYA OPERASIONAL ===== */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 mb-6">
          <h3 className="text-sm font-bold text-gray-600 mb-3">📝 Tambah Biaya Operasional</h3>
          <form onSubmit={handleAddExpense} className="flex flex-col sm:flex-row gap-3">
            <select 
              value={expenseType} 
              onChange={(e) => setExpenseType(e.target.value as any)} 
              className="border rounded-lg px-3 py-2 text-sm flex-1"
            >
              <option value="Gaji Karyawan">Gaji Karyawan</option>
              <option value="Listrik & Air">Listrik & Air</option>
              <option value="Internet">Internet</option>
              <option value="BBM & Transportasi">BBM & Transportasi</option>
              <option value="Lainnya">Lainnya</option>
            </select>
            <input 
              type="number" 
              value={expenseAmount} 
              onChange={(e) => setExpenseAmount(e.target.value ? Number(e.target.value) : '')} 
              placeholder="Nominal (Rp)" 
              className="border rounded-lg px-3 py-2 text-sm flex-1"
            />
            <input 
              type="text" 
              value={expenseNote} 
              onChange={(e) => setExpenseNote(e.target.value)} 
              placeholder="Catatan (opsional)" 
              className="border rounded-lg px-3 py-2 text-sm flex-1"
            />
            <button 
              type="submit" 
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-4 py-2 rounded-lg"
            >
              <Plus className="w-4 h-4 inline mr-1" /> Tambah
            </button>
          </form>
        </div>

        {/* ===== DAFTAR BIAYA TERBARU ===== */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 mb-6">
          <h3 className="text-sm font-bold text-gray-600 mb-3">📋 Daftar Biaya Operasional</h3>
          {filteredExpenses.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Belum ada biaya operasional</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-3 py-2 font-bold text-gray-500">Tanggal</th>
                    <th className="text-left px-3 py-2 font-bold text-gray-500">Jenis</th>
                    <th className="text-right px-3 py-2 font-bold text-gray-500">Nominal</th>
                    <th className="text-left px-3 py-2 font-bold text-gray-500">Catatan</th>
                    <th className="text-center px-3 py-2 font-bold text-gray-500">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExpenses.slice(0, 5).map((exp) => (
                    <tr key={exp.id} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="px-3 py-2 text-gray-600">
                        {new Date(exp.timestamp).toLocaleDateString('id-ID')}
                      </td>
                      <td className="px-3 py-2 font-medium text-gray-700">{exp.type}</td>
                      <td className="px-3 py-2 text-right font-bold text-gray-800">
                        Rp {exp.amount.toLocaleString('id-ID')}
                      </td>
                      <td className="px-3 py-2 text-gray-500">{exp.note || '-'}</td>
                      <td className="px-3 py-2 text-center">
                        <button 
                          type="button" 
                          onClick={() => handleDeleteExpense(exp.id)} 
                          className="text-red-400 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ===== MANAJEMEN KATEGORI ===== */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200">
          <h3 className="text-sm font-bold text-gray-600 mb-3">🏷️ Manajemen Kategori</h3>
          <form onSubmit={handleAddCategory} className="flex gap-2 mb-3">
            <input 
              type="text" 
              value={newCategoryName} 
              onChange={(e) => setNewCategoryName(e.target.value)} 
              placeholder="Nama kategori baru..." 
              className="border rounded-lg px-3 py-2 text-sm flex-1"
            />
            <button 
              type="submit" 
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-4 py-2 rounded-lg"
            >
              <Plus className="w-4 h-4 inline" /> Tambah
            </button>
          </form>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <div key={cat.id} className="flex items-center gap-1 bg-gray-100 px-3 py-1.5 rounded-full">
                <Tag className="w-3 h-3 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">{cat.name}</span>
                <button 
                  type="button" 
                  onClick={() => handleDeleteCategory(cat.id)} 
                  className="text-red-400 hover:text-red-600 ml-1"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
            {categories.length === 0 && (
              <p className="text-sm text-gray-400">Belum ada kategori</p>
            )}
          </div>
        </div>
      </div>

      {/* ===== MODAL LISENSI ===== */}
      {showSecretLicenseModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="text-center mb-4">
              <Key className="w-12 h-12 text-emerald-600 mx-auto mb-2" />
              <h3 className="text-xl font-bold">Aktivasi Premium White-Label</h3>
              <p className="text-sm text-gray-500">Masukkan PIN Sakti untuk membuka semua fitur</p>
            </div>
            <form onSubmit={handleActivateLicense}>
              <input 
                type="password" 
                value={licenseKeyInput} 
                onChange={(e) => setLicenseKeyInput(e.target.value)} 
                placeholder="Masukkan PIN 4 digit..." 
                className="w-full border rounded-lg px-4 py-2 text-center text-lg font-mono" 
                maxLength={4}
              />
              <div className="flex gap-2 mt-4">
                <button 
                  type="button" 
                  onClick={() => setShowSecretLicenseModal(false)} 
                  className="flex-1 bg-gray-200 hover:bg-gray-300 font-bold py-2 rounded-lg"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-lg"
                >
                  Aktifkan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}