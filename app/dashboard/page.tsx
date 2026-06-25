"use client";

import React, { useState, useEffect } from 'react';
import { dbLocal, LocalProduct, LocalSale, OperationalExpense } from '@/lib/dbLocal';
import { LayoutDashboard, Wallet, FileSpreadsheet, FileText, Store, Calendar, TrendingUp, Search, DollarSign, Plus, Trash2 } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function DashboardPage() {
  const [products, setProducts] = useState<LocalProduct[]>([]);
  const [allSales, setAllSales] = useState<LocalSale[]>([]);
  const [filteredSales, setFilteredSales] = useState<LocalSale[]>([]);
  const [expenses, setExpenses] = useState<OperationalExpense[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<OperationalExpense[]>([]);
  
  // State Filter Kalender Tanggal Custom (Otomatis menampilkan bulan berjalan Juni 2026)
  const [startDate, setStartDate] = useState<string>('2026-06-01');
  const [endDate, setEndDate] = useState<string>('2026-06-25');
  
  // State Input Form Biaya Operasional
  const [expenseType, setExpenseType] = useState<'Gaji Karyawan' | 'Listrik & Air' | 'Internet' | 'BBM & Transportasi' | 'Lainnya'>('Listrik & Air');
  const [expenseAmount, setExpenseAmount] = useState<number | ''>('');
  const [expenseNote, setExpenseNote] = useState('');

  // State Keuangan Akuntansi Akurat
  const [totalAset, setTotalAset] = useState(0);
  const [totalOmzetPenjualan, setTotalOmzetPenjualan] = useState(0);
  const [totalHargaBeliModal, setTotalHargaBeliModal] = useState(0); 
  const [totalBiayaOperasional, setTotalBiayaOperasional] = useState(0); 
  const [totalLabaBersih, setTotalLabaBersih] = useState(0);       
  const [totalStokFisik, setTotalStokFisik] = useState(0);
  
  const [shopName, setShopName] = useState('ANI AGRO');
  const [logoUrl, setLogoUrl] = useState('');

  useEffect(() => {
    loadBaseData();
  }, []);

  const loadBaseData = async () => {
    const dataProduk = await dbLocal.products.toArray();
    const dataPenjualan = await dbLocal.sales.toArray();
    const dataBiaya = await dbLocal.expenses.toArray();
    
    setProducts(dataProduk);
    setAllSales(dataPenjualan);
    setExpenses(dataBiaya);

    // Hitung Total Nilai Investasi Barang yang Mengendap di Gudang
    const aset = dataProduk.reduce((sum, p) => sum + (p.stock * (p.purchasePrice || 0)), 0);
    const stok = dataProduk.reduce((sum, p) => sum + p.stock, 0);
    setTotalAset(aset);
    setTotalStokFisik(stok);

    const savedConfig = await dbLocal.config.get('shop_settings');
    if (savedConfig) {
      setShopName(savedConfig.shopName);
      setLogoUrl(savedConfig.logoBase64);
    }
  };

  // LOGIKA UTAMA SINKRONISASI FILTER KALENDER & KALKULATOR LABA BERSIH
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
        sale.items.forEach(item => {
          totalModalTerjual += ((item.purchasePrice || 0) * item.quantity);
        });
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

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseAmount || isNaN(Number(expenseAmount))) return alert('Jumlah nominal biaya wajib diisi angka!');

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
    alert('Biaya operasional toko berhasil dicatat ke jurnal akunting!');
  };

  const handleDeleteExpense = async (id: string) => {
    if (confirm('Hapus catatan pengeluaran ini?')) {
      await dbLocal.expenses.delete(id);
      loadBaseData();
    }
  };

  const exportToExcel = () => {
    const dataLaporan = filteredSales.map((sale) => ({
      "No Nota": sale.id,
      "Waktu Transaksi": new Date(sale.timestamp).toLocaleString('id-ID'),
      "Total Omzet (Rp)": sale.totalPrice
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataLaporan);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Finansial");
    XLSX.writeFile(workbook, `Laporan_Laba_Rugi_${startDate}.xlsx`);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-6 font-sans print:bg-white print:p-0">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER DASHBOARD UTAMA */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 print:hidden">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-600 text-white p-2.5 rounded-xl shadow-md"><Store className="w-6 h-6" /></div>
            <div>
              <h1 className="text-2xl font-black text-emerald-800 uppercase tracking-tight">{shopName}</h1>
              <p className="text-xs text-gray-400 font-bold">Modul Pusat Akunting & Manajemen Biaya Operasional Terintegrasi</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={exportToExcel} className="bg-white hover:bg-gray-100 text-emerald-700 font-bold text-xs px-4 py-2 rounded-xl border shadow-sm transition flex items-center gap-1.5"><FileSpreadsheet className="w-4 h-4" /> EXCEL</button>
            <button onClick={() => window.print()} className="bg-white hover:bg-gray-100 text-blue-700 font-bold text-xs px-4 py-2 rounded-xl border shadow-sm transition flex items-center gap-1.5"><FileText className="w-4 h-4" /> PRINT PDF</button>
          </div>
        </div>

        {/* BARIS PANEL FILTER KALENDER TANGGAL */}
        <div className="bg-emerald-800 text-white p-5 rounded-2xl shadow-md mb-6 flex flex-col md:flex-row items-center justify-between gap-4 print:hidden">
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
            <div className="w-full">
              <label className="block text-[10px] font-bold text-emerald-200 uppercase mb-1">Audit Tanggal Mulai</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full bg-emerald-900 border border-emerald-700 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-emerald-400 text-white" />
            </div>
            <div className="w-full">
              <label className="block text-[10px] font-bold text-emerald-200 uppercase mb-1">Audit Tanggal Akhir</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full bg-emerald-900 border border-emerald-700 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-emerald-400 text-white" />
            </div>
          </div>
          <div className="bg-emerald-900/50 border border-emerald-700 p-4 rounded-xl w-full md:w-72 text-right">
            <p className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider mb-0.5">Uang Masuk Kotor (Omzet)</p>
            <h2 className="text-2xl font-black text-white">Rp {totalOmzetPenjualan.toLocaleString('id-ID')}</h2>
          </div>
        </div>

        {/* 4 KARTU NERACA FINANSIAL LABA RUGI BERSIH */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">💰 Pendapatan Kotor (Omzet)</p>
            <h3 className="text-base font-black text-gray-800">Rp {totalOmzetPenjualan.toLocaleString('id-ID')}</h3>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">📉 Harga Pokok Penjualan (HPP)</p>
            <h3 className="text-base font-black text-red-600">Rp {totalHargaBeliModal.toLocaleString('id-ID')}</h3>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">💸 Biaya Operasional Toko</p>
            <h3 className="text-base font-black text-amber-600">Rp {totalBiayaOperasional.toLocaleString('id-ID')}</h3>
          </div>
          {/* LABA BERSIH SEBENARNYA */}
          <div className="bg-emerald-50 p-5 rounded-2xl border-2 border-emerald-300 shadow-md flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-emerald-700 uppercase tracking-wider mb-1">🎉 KEUNTUNGAN BERSIH SEBENARNYA</p>
              <h3 className="text-lg font-black text-emerald-800">Rp {totalLabaBersih.toLocaleString('id-ID')}</h3>
            </div>
            <DollarSign className="text-emerald-600 w-5 h-5" />
          </div>
        </div>

        {/* LOWER GRID: FORM INPUT BIAYA OPERASIONAL & DAFTAR TABEL */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Jurnal Pengeluaran Biaya Operasional */}
          <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm print:hidden">
            <h2 className="text-lg font-bold text-emerald-800 mb-4 flex items-center gap-2"><Wallet className="w-5 h-5" /> Catat Biaya Operasional</h2>
            <form onSubmit={handleAddExpense} className="space-y-4">
              <div>
                <label htmlFor="expenseType" className="block text-xs font-semibold text-gray-600 mb-1">Jenis Biaya</label>
                <select id="expenseType" value={expenseType} onChange={(e) => setExpenseType(e.target.value as 'Gaji Karyawan' | 'Listrik & Air' | 'Internet' | 'BBM & Transportasi' | 'Lainnya')} className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm focus:ring-emerald-500 focus:border-emerald-500">
                  <option>Gaji Karyawan</option>
                  <option>Listrik & Air</option>
                  <option>Internet</option>
                  <option>BBM & Transportasi</option>
                  <option>Lainnya</option>
                </select>
              </div>
              <div>
                <label htmlFor="expenseAmount" className="block text-xs font-semibold text-gray-600 mb-1">Jumlah Nominal (Rp)</label>
                <input type="number" id="expenseAmount" value={expenseAmount} onChange={(e) => setExpenseAmount(e.target.value === '' ? '' : Number(e.target.value))} className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm focus:ring-emerald-500 focus:border-emerald-500" placeholder="Contoh: 50000" />
              </div>
              <div>
                <label htmlFor="expenseNote" className="block text-xs font-semibold text-gray-600 mb-1">Keterangan (Opsional)</label>
                <input type="text" id="expenseNote" value={expenseNote} onChange={(e) => setExpenseNote(e.target.value)} className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm focus:ring-emerald-500 focus:border-emerald-500" placeholder="Contoh: Bayar tagihan listrik bulan Juni" />
              </div>
              <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-xl transition flex items-center justify-center gap-2"><Plus className="w-4 h-4" /> Catat Biaya</button>
            </form>
          </div>

          {/* Tabel Daftar Biaya Operasional */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <h2 className="text-lg font-bold text-emerald-800 mb-4 flex items-center gap-2"><FileText className="w-5 h-5" /> Jurnal Biaya Operasional</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Waktu</th>
                    <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jenis Biaya</th>
                    <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nominal</th>
                    <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Keterangan</th>
                    <th scope="col" className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider print:hidden">Aksi</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredExpenses.map((expense) => (
                    <tr key={expense.id}>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800">{new Date(expense.timestamp).toLocaleString('id-ID')}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800">{expense.type}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-red-600 font-semibold">- Rp {expense.amount.toLocaleString('id-ID')}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800">{expense.note}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-right text-sm font-medium print:hidden">
                        <button onClick={() => handleDeleteExpense(expense.id)} className="text-red-600 hover:text-red-900"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredExpenses.length === 0 && (
              <p className="text-center text-gray-500 mt-4">Belum ada biaya operasional tercatat untuk periode ini.</p>
            )}
          </div>
        </div>

        {/* BAGIAN PRINT SAJA */}
        <div className="hidden print:block mt-8">
          <h1 className="text-2xl font-black text-emerald-800 uppercase tracking-tight mb-2">Laporan Laba Rugi {shopName}</h1>
          <p className="text-sm text-gray-600 mb-4">Periode: {new Date(startDate).toLocaleDateString('id-ID')} - {new Date(endDate).toLocaleDateString('id-ID')}</p>
          
          <table className="min-w-full divide-y divide-gray-200 mb-6">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deskripsi</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Jumlah (Rp)</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">Pendapatan Kotor (Omzet)</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-right text-gray-800">{totalOmzetPenjualan.toLocaleString('id-ID')}</td>
              </tr>
              <tr>
                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">Harga Pokok Penjualan (HPP)</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-right text-red-600">({totalHargaBeliModal.toLocaleString('id-ID')})</td>
              </tr>
              <tr>
                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">Biaya Operasional Toko</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-right text-amber-600">({totalBiayaOperasional.toLocaleString('id-ID')})</td>
              </tr>
              <tr className="bg-emerald-50 font-bold">
                <td className="px-4 py-2 whitespace-nowrap text-sm text-emerald-800">KEUNTUNGAN BERSIH</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-right text-emerald-800">{totalLabaBersih.toLocaleString('id-ID')}</td>
              </tr>
            </tbody>
          </table>

          <h2 className="text-lg font-bold text-emerald-800 mb-3">Rincian Biaya Operasional</h2>
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Waktu</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jenis Biaya</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nominal</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Keterangan</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredExpenses.map((expense) => (
                <tr key={expense.id}>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800">{new Date(expense.timestamp).toLocaleString('id-ID')}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800">{expense.type}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-red-600 font-semibold">- Rp {expense.amount.toLocaleString('id-ID')}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800">{expense.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredExpenses.length === 0 && (
            <p className="text-center text-gray-500 mt-4">Belum ada biaya operasional tercatat untuk periode ini.</p>
          )}
        </div>

      </div>
    </div>
  );
}