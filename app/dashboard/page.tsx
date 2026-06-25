"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { dbLocal, LocalProduct, LocalSale, OperationalExpense } from '@/lib/dbLocal';
import { 
  LayoutDashboard, Wallet, FileSpreadsheet, FileText, Store, 
  Calendar, TrendingUp, Search, DollarSign, Plus, Trash2, 
  Tag, ArrowUpRight, ArrowDownRight, PieChart, Activity
} from 'lucide-react';
import * as XLSX from 'xlsx';

export default function DashboardPage() {
  const [products, setProducts] = useState<LocalProduct[]>([]);
  const [allSales, setAllSales] = useState<LocalSale[]>([]);
  const [expenses, setExpenses] = useState<OperationalExpense[]>([]);
  
  // State Filter Kalender Tanggal Custom
  const today = new Date().toISOString().split('T')[0];
  const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
  
  const [startDate, setStartDate] = useState<string>(firstDayOfMonth);
  const [endDate, setEndDate] = useState<string>(today);
  
  // State Input Form Biaya Operasional (BRD Poin 15)
  const [expenseType, setExpenseType] = useState<string>('Listrik & Air');
  const [expenseAmount, setExpenseAmount] = useState<number | ''>('');
  const [expenseNote, setExpenseNote] = useState('');

  // State Keuangan
  const [totalAset, setTotalAset] = useState(0);
  const [totalStokFisik, setTotalStokFisik] = useState(0);
  
  const [shopName, setShopName] = useState('SISUKA POS');
  const [logoUrl, setLogoUrl] = useState('');

  useEffect(() => {
    loadBaseData();
  }, []);

  const loadBaseData = async () => {
    try {
      const dataProduk = await dbLocal.products.toArray();
      const dataPenjualan = await dbLocal.sales.toArray();
      const dataBiaya = await dbLocal.expenses.toArray();
      
      setProducts(dataProduk);
      setAllSales(dataPenjualan);
      setExpenses(dataBiaya);

      // Hitung Total Nilai Investasi Barang yang Mengendap di Gudang
      const aset = dataProduk.reduce((sum, p) => sum + (Number(p.stock) * (Number(p.purchasePrice) || 0)), 0);
      const stok = dataProduk.reduce((sum, p) => sum + Number(p.stock), 0);
      setTotalAset(aset);
      setTotalStokFisik(stok);

      const savedConfig = await dbLocal.config.get('shop_settings');
      if (savedConfig) {
        setShopName(savedConfig.shopName || 'SISUKA POS');
        setLogoUrl(savedConfig.logoBase64 || '');
      }
    } catch (error) {
      console.error("Gagal memuat data dashboard:", error);
    }
  };

  // LOGIKA UTAMA: KALKULATOR LABA RUGI BERSIH (BRD Poin 14 & 15)
  const financialData = useMemo(() => {
    if (!startDate || !endDate) return { 
      omzet: 0, hpp: 0, operasional: 0, labaBersih: 0, 
      filteredSales: [], filteredExpenses: [] 
    };

    const startTimestamp = new Date(`${startDate}T00:00:00`).getTime();
    const endTimestamp = new Date(`${endDate}T23:59:59`).getTime();

    const filteredSales = allSales.filter(sale => sale.timestamp >= startTimestamp && sale.timestamp <= endTimestamp);
    const filteredExpenses = expenses.filter(exp => exp.timestamp >= startTimestamp && exp.timestamp <= endTimestamp);

    const omzet = filteredSales.reduce((sum, sale) => sum + Number(sale.totalPrice), 0);
    
    let hpp = 0;
    filteredSales.forEach(sale => {
      if (sale.items) {
        sale.items.forEach(item => {
          hpp += (Number(item.purchasePrice || 0) * Number(item.quantity));
        });
      }
    });

    const operasional = filteredExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
    const labaBersih = omzet - hpp - operasional;

    return { omzet, hpp, operasional, labaBersih, filteredSales, filteredExpenses };
  }, [allSales, expenses, startDate, endDate]);

  // FUNGSI: INPUT BIAYA OPERASIONAL TOKO BARU (BRD Poin 15)
  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (expenseAmount === '' || isNaN(Number(expenseAmount))) {
      return alert('Jumlah nominal biaya operasional wajib diisi angka!');
    }

    try {
      await dbLocal.expenses.add({
        id: `EXP-${Date.now()}`,
        timestamp: Date.now(),
        type: expenseType,
        amount: Number(expenseAmount),
        note: expenseNote
      });

      setExpenseAmount('');
      setExpenseNote('');
      loadBaseData();
      alert('Biaya pengeluaran operasional toko berhasil dicatat!');
    } catch (error) {
      console.error("Gagal menambah biaya:", error);
      alert('Gagal menyimpan data biaya.');
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (confirm('Hapus catatan pengeluaran operasional ini?')) {
      try {
        await dbLocal.expenses.delete(id);
        loadBaseData();
      } catch (error) {
        console.error("Gagal menghapus biaya:", error);
      }
    }
  };

  const exportToExcel = () => {
    const dataLaporan = financialData.filteredSales.map((sale) => ({
      "No Nota": sale.id,
      "Waktu Transaksi": new Date(sale.timestamp).toLocaleString('id-ID'),
      "Total Omzet (Rp)": sale.totalPrice,
      "Metode Bayar": sale.paymentMethod
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(dataLaporan);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Penjualan");
    XLSX.writeFile(workbook, `Laporan_SISUKA_${startDate}_sd_${endDate}.xlsx`);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-6 font-sans print:bg-white print:p-0">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER DASHBOARD */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4 print:hidden">
          <div className="flex items-center gap-4">
            <div className="bg-emerald-600 text-white p-3 rounded-2xl shadow-lg shadow-emerald-100">
              <LayoutDashboard className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-800 tracking-tight">{shopName}</h1>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Pusat Analisa Bisnis & Akunting</p>
            </div>
          </div>
          <div className="flex gap-3 w-full lg:w-auto">
            <button 
              onClick={exportToExcel} 
              className="flex-1 lg:flex-none bg-white hover:bg-gray-50 text-emerald-700 font-bold text-xs px-5 py-3 rounded-2xl border border-gray-200 shadow-sm transition-all flex items-center justify-center gap-2"
            >
              <FileSpreadsheet className="w-4 h-4" /> EXCEL
            </button>
            <button 
              onClick={() => window.print()} 
              className="flex-1 lg:flex-none bg-gray-900 hover:bg-black text-white font-bold text-xs px-5 py-3 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <FileText className="w-4 h-4" /> PRINT PDF
            </button>
          </div>
        </div>

        {/* FILTER TANGGAL & RINGKASAN CEPAT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 print:hidden">
          <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-end gap-4">
            <div className="flex-1 w-full">
              <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-1">Periode Mulai</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-3 w-4 h-4 text-emerald-600" />
                <input 
                  type="date" 
                  value={startDate} 
                  onChange={(e) => setStartDate(e.target.value)} 
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-11 pr-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500 transition-all" 
                />
              </div>
            </div>
            <div className="flex-1 w-full">
              <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-1">Periode Akhir</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-3 w-4 h-4 text-emerald-600" />
                <input 
                  type="date" 
                  value={endDate} 
                  onChange={(e) => setEndDate(e.target.value)} 
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-11 pr-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500 transition-all" 
                />
              </div>
            </div>
          </div>
          
          <div className="bg-emerald-600 text-white p-6 rounded-3xl shadow-xl shadow-emerald-100 flex flex-col justify-center">
            <p className="text-[10px] font-black text-emerald-100 uppercase tracking-widest mb-1">Total Omzet Periode Ini</p>
            <h2 className="text-3xl font-black">{formatCurrency(financialData.omzet)}</h2>
          </div>
        </div>

        {/* STATS CARDS (BRD Poin 14) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl"><TrendingUp className="w-5 h-5" /></div>
              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg flex items-center gap-1">
                <ArrowUpRight className="w-3 h-3" /> Omzet
              </span>
            </div>
            <p className="text-xs font-bold text-gray-400 uppercase mb-1">Total Penjualan</p>
            <h3 className="text-xl font-black text-gray-800">{formatCurrency(financialData.omzet)}</h3>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-red-50 text-red-600 rounded-xl"><Tag className="w-5 h-5" /></div>
              <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-1 rounded-lg flex items-center gap-1">
                <ArrowDownRight className="w-3 h-3" /> HPP
              </span>
            </div>
            <p className="text-xs font-bold text-gray-400 uppercase mb-1">Modal Terjual</p>
            <h3 className="text-xl font-black text-gray-800">{formatCurrency(financialData.hpp)}</h3>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-amber-50 text-amber-600 rounded-xl"><Wallet className="w-5 h-5" /></div>
              <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg flex items-center gap-1">
                <ArrowDownRight className="w-3 h-3" /> Biaya
              </span>
            </div>
            <p className="text-xs font-bold text-gray-400 uppercase mb-1">Operasional</p>
            <h3 className="text-xl font-black text-gray-800">{formatCurrency(financialData.operasional)}</h3>
          </div>

          <div className="bg-emerald-50 p-6 rounded-3xl border-2 border-emerald-100 shadow-lg shadow-emerald-50 flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-emerald-600 text-white rounded-xl"><DollarSign className="w-5 h-5" /></div>
              <span className="text-[10px] font-black text-emerald-700 uppercase">Net Profit</span>
            </div>
            <div>
              <p className="text-xs font-bold text-emerald-600/70 uppercase mb-1">Laba Bersih Sebenarnya</p>
              <h3 className="text-2xl font-black text-emerald-800">{formatCurrency(financialData.labaBersih)}</h3>
            </div>
          </div>
        </div>

        {/* MODUL INPUT BIAYA OPERASIONAL (BRD Poin 15) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm sticky top-6">
              <h3 className="text-lg font-black text-gray-800 mb-6 flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-600" /> Catat Pengeluaran
              </h3>
              <form onSubmit={handleAddExpense} className="space-y-5">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-1">Kategori Biaya</label>
                  <select 
                    value={expenseType} 
                    onChange={(e) => setExpenseType(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option>Gaji Karyawan</option>
                    <option>Listrik & Air</option>
                    <option>Internet</option>
                    <option>BBM & Transportasi</option>
                    <option>Sewa Tempat</option>
                    <option>Marketing</option>
                    <option>Lainnya</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-1">Nominal (Rp)</label>
                  <input 
                    type="number" 
                    placeholder="Contoh: 50000"
                    value={expenseAmount} 
                    onChange={(e) => setExpenseAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-1">Catatan Tambahan</label>
                  <textarea 
                    placeholder="Keterangan pengeluaran..."
                    value={expenseNote} 
                    onChange={(e) => setExpenseNote(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500 h-24 resize-none"
                  />
                </div>
                <button 
                  type="submit" 
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 rounded-2xl shadow-lg shadow-emerald-100 transition-all flex items-center justify-center gap-2"
                >
                  SIMPAN PENGELUARAN
                </button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                <h3 className="font-black text-gray-800 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-emerald-600" /> Riwayat Biaya Operasional
                </h3>
                <span className="text-[10px] font-bold bg-white px-3 py-1 rounded-full border border-gray-200 text-gray-500">
                  {financialData.filteredExpenses.length} Transaksi
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50">
                      <th className="px-6 py-4">Tanggal</th>
                      <th className="px-6 py-4">Kategori</th>
                      <th className="px-6 py-4">Catatan</th>
                      <th className="px-6 py-4 text-right">Nominal</th>
                      <th className="px-6 py-4 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {financialData.filteredExpenses.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-gray-400 italic text-sm">
                          Belum ada catatan pengeluaran di periode ini
                        </td>
                      </tr>
                    ) : (
                      financialData.filteredExpenses.map((exp) => (
                        <tr key={exp.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4 text-xs font-bold text-gray-500">
                            {new Date(exp.timestamp).toLocaleDateString('id-ID')}
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-[10px] font-black bg-amber-50 text-amber-700 px-2 py-1 rounded-lg uppercase">
                              {exp.type}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs text-gray-600 max-w-[200px] truncate">
                            {exp.note || '-'}
                          </td>
                          <td className="px-6 py-4 text-sm font-black text-gray-800 text-right">
                            {formatCurrency(exp.amount)}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button 
                              onClick={() => handleDeleteExpense(exp.id)}
                              className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* RINGKASAN STOK & ASET (BRD Poin 4 & 6) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-8">
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
                <div className="p-4 bg-purple-50 text-purple-600 rounded-2xl"><PieChart className="w-6 h-6" /></div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase">Total Stok Fisik</p>
                  <h4 className="text-xl font-black text-gray-800">{totalStokFisik} <span className="text-xs font-bold text-gray-400">Unit</span></h4>
                </div>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
                <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl"><Store className="w-6 h-6" /></div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase">Nilai Aset Gudang</p>
                  <h4 className="text-xl font-black text-gray-800">{formatCurrency(totalAset)}</h4>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
        }
      `}</style>
    </div>
  );
}
