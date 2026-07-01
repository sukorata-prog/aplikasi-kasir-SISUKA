"use client";

import React, { useState, useEffect } from 'react';
import { dbLocal } from '@/lib/dbLocal';
import * as XLSX from 'xlsx';
import { 
  FileText, 
  Download, 
  Printer, 
  Calendar, 
  TrendingUp, 
  TrendingDown,
  Package,
  DollarSign,
  ShoppingCart,
  BarChart3
} from 'lucide-react';
import Link from 'next/link';

interface Product {
  id: string;
  name: string;
  stock: number;
  purchasePrice: number;
  sellingPrice: number;
  category?: string;
}

interface SaleItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  purchasePrice?: number;
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

export default function LaporanPage() {
  // ===== STATE =====
  const [products, setProducts] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filteredSales, setFilteredSales] = useState<Sale[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
  const [totalOmzet, setTotalOmzet] = useState<number>(0);
  const [totalModal, setTotalModal] = useState<number>(0);
  const [totalBiaya, setTotalBiaya] = useState<number>(0);
  const [totalLaba, setTotalLaba] = useState<number>(0);
  const [totalTransaksi, setTotalTransaksi] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<string>('penjualan');

  const [startDate, setStartDate] = useState<string>(() => {
    const date = new Date();
    date.setDate(1);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  // ===== LOAD DATA =====
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const dataProduk = await dbLocal.products.toArray();
      const dataPenjualan = await dbLocal.sales.toArray();
      const dataBiaya = await dbLocal.expenses.toArray();
      
      setProducts(dataProduk);
      setSales(dataPenjualan);
      setExpenses(dataBiaya);
    } catch (err) {
      console.error("Gagal memuat data:", err);
    }
  };

  // ===== FILTER DATA =====
  useEffect(() => {
    if (!startDate || !endDate) return;
    
    const start = new Date(`${startDate}T00:00:00`).getTime();
    const end = new Date(`${endDate}T23:59:59`).getTime();

    const filteredSales = sales.filter((s: Sale) => s.timestamp >= start && s.timestamp <= end);
    const filteredExpenses = expenses.filter((e: Expense) => e.timestamp >= start && e.timestamp <= end);

    setFilteredSales(filteredSales);
    setFilteredExpenses(filteredExpenses);

    const omzet = filteredSales.reduce((sum: number, s: Sale) => sum + s.totalPrice, 0);
    setTotalOmzet(omzet);

    let modal = 0;
    filteredSales.forEach((sale: Sale) => {
      if (sale.items) {
        sale.items.forEach((item: SaleItem) => {
          modal += (item.purchasePrice || 0) * item.quantity;
        });
      }
    });
    setTotalModal(modal);

    const biaya = filteredExpenses.reduce((sum: number, e: Expense) => sum + e.amount, 0);
    setTotalBiaya(biaya);
    setTotalLaba(omzet - modal - biaya);
    setTotalTransaksi(filteredSales.length);

  }, [sales, expenses, startDate, endDate]);

  // ===== FORMAT RUPIAH =====
  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(angka);
  };

  // ===== FORMAT TANGGAL =====
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // ===== EKSPOR EXCEL PENJUALAN DENGAN DETAIL PER ITEM =====
  const exportToExcel = (data: any[], filename: string, type: string = 'default') => {
    if (data.length === 0) {
      alert('Tidak ada data untuk diekspor!');
      return;
    }

    let excelData: any[] = [];
    let sheetName = 'Laporan';

    // ===== EKSPOR PENJUALAN DENGAN DETAIL PER ITEM =====
    if (type === 'penjualan') {
      sheetName = 'Penjualan Detail';
      
      data.forEach((sale: any) => {
        const tanggal = new Date(sale.timestamp).toLocaleDateString('id-ID', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
        
        if (sale.items && sale.items.length > 0) {
          // Setiap item di baris sendiri
          sale.items.forEach((item: any) => {
            const subtotal = item.price * item.quantity;
            excelData.push({
              'Tanggal': tanggal,
              'ID Transaksi': sale.id,
              'Nama Produk': item.name,
              'Qty': item.quantity,
              'Harga Satuan': item.price,
              'Subtotal': subtotal,
              'Metode': sale.paymentMethod || 'TUNAI'
            });
          });
          
          // Baris total per transaksi (dengan format beda)
          excelData.push({
            'Tanggal': '',
            'ID Transaksi': '',
            'Nama Produk': '🟢 TOTAL TRANSAKSI',
            'Qty': '',
            'Harga Satuan': '',
            'Subtotal': sale.totalPrice,
            'Metode': ''
          });
          
          // Baris kosong sebagai pemisah antar transaksi
          excelData.push({
            'Tanggal': '',
            'ID Transaksi': '',
            'Nama Produk': '',
            'Qty': '',
            'Harga Satuan': '',
            'Subtotal': '',
            'Metode': ''
          });
        } else {
          // Jika tidak ada item
          excelData.push({
            'Tanggal': tanggal,
            'ID Transaksi': sale.id,
            'Nama Produk': '-',
            'Qty': 0,
            'Harga Satuan': 0,
            'Subtotal': sale.totalPrice,
            'Metode': sale.paymentMethod || 'TUNAI'
          });
        }
      });
      
      // Tambahkan Grand Total di akhir
      const grandTotal = data.reduce((sum: number, s: any) => sum + s.totalPrice, 0);
      excelData.push({
        'Tanggal': '',
        'ID Transaksi': '',
        'Nama Produk': '🔵 GRAND TOTAL',
        'Qty': '',
        'Harga Satuan': '',
        'Subtotal': grandTotal,
        'Metode': ''
      });
      
    } 
    // ===== EKSPOR PRODUK TERLARIS =====
    else if (type === 'produk') {
      sheetName = 'Produk Terlaris';
      data.forEach((row: any, index: number) => {
        excelData.push({
          'No': index + 1,
          'Nama Produk': row.name,
          'Terjual': row.quantity,
          'Pendapatan': row.revenue
        });
      });
    } 
    // ===== EKSPOR BIAYA =====
    else if (type === 'biaya') {
      sheetName = 'Biaya Operasional';
      data.forEach((row: any) => {
        excelData.push({
          'Tanggal': new Date(row.timestamp).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
          }),
          'Jenis': row.type,
          'Nominal': row.amount,
          'Catatan': row.note || '-'
        });
      });
      
      const totalBiaya = data.reduce((sum: number, e: any) => sum + e.amount, 0);
      excelData.push({
        'Tanggal': '',
        'Jenis': 'TOTAL BIAYA',
        'Nominal': totalBiaya,
        'Catatan': ''
      });
    } 
    // ===== EKSPOR DEFAULT =====
    else {
      excelData = data;
    }

    // Buat workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    // ===== FORMAT KOLOM =====
    ws['!cols'] = [
      { wch: 25 }, // Tanggal
      { wch: 18 }, // ID Transaksi
      { wch: 30 }, // Nama Produk
      { wch: 10 }, // Qty
      { wch: 18 }, // Harga Satuan
      { wch: 18 }, // Subtotal
      { wch: 15 }  // Metode
    ];

    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // ===== RENDER TAB RINGKASAN =====
  const renderRingkasan = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-gray-500">Total Omzet</span>
            <TrendingUp className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-gray-800 mt-2">{formatRupiah(totalOmzet)}</p>
          <p className="text-xs text-gray-400 mt-1">{totalTransaksi} transaksi</p>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-gray-500">Modal HPP</span>
            <Package className="w-5 h-5 text-orange-500" />
          </div>
          <p className="text-2xl font-bold text-gray-800 mt-2">{formatRupiah(totalModal)}</p>
          <p className="text-xs text-gray-400 mt-1">Harga Pokok Penjualan</p>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-gray-500">Biaya Operasional</span>
            <DollarSign className="w-5 h-5 text-red-500" />
          </div>
          <p className="text-2xl font-bold text-gray-800 mt-2">{formatRupiah(totalBiaya)}</p>
          <p className="text-xs text-gray-400 mt-1">{filteredExpenses.length} pengeluaran</p>
        </div>

        <div className={`bg-white p-4 rounded-2xl shadow-sm border ${totalLaba >= 0 ? 'border-emerald-300' : 'border-red-300'}`}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-gray-500">Laba Bersih</span>
            {totalLaba >= 0 ? (
              <TrendingUp className="w-5 h-5 text-emerald-500" />
            ) : (
              <TrendingDown className="w-5 h-5 text-red-500" />
            )}
          </div>
          <p className={`text-2xl font-bold mt-2 ${totalLaba >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {formatRupiah(totalLaba)}
          </p>
          <p className={`text-xs mt-1 ${totalLaba >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
            {totalLaba >= 0 ? '✅ Perusahaan Untung' : '❌ Perusahaan Rugi'}
          </p>
        </div>
      </div>
    </div>
  );

  // ===== RENDER TAB PENJUALAN =====
  const renderPenjualan = () => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-sm font-bold text-gray-800">📋 Daftar Transaksi Penjualan</h3>
        <button 
          onClick={() => exportToExcel(filteredSales, 'laporan_penjualan', 'penjualan')}
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3 py-1.5 rounded-lg flex items-center gap-1"
        >
          <Download className="w-3.5 h-3.5" /> Ekspor Excel
        </button>
      </div>
      
      {filteredSales.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <ShoppingCart className="w-12 h-12 mx-auto mb-2 text-gray-300" />
          <p>Belum ada transaksi dalam periode ini</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-bold text-gray-700">Tanggal</th>
                <th className="text-left px-4 py-3 font-bold text-gray-700">ID Transaksi</th>
                <th className="text-left px-4 py-3 font-bold text-gray-700">Item</th>
                <th className="text-right px-4 py-3 font-bold text-gray-700">Total</th>
                <th className="text-left px-4 py-3 font-bold text-gray-700">Metode</th>
              </tr>
            </thead>
            <tbody>
              {filteredSales.map((sale: Sale, index: number) => (
                <tr key={sale.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-3 text-gray-700">{formatDate(sale.timestamp)}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{sale.id}</td>
                  <td className="px-4 py-3">
                    {sale.items && sale.items.length > 0 ? (
                      <div className="flex flex-col gap-0.5">
                        {sale.items.map((item: SaleItem, i: number) => (
                          <span key={i} className="text-xs text-gray-800 font-medium">
                            {item.name} × {item.quantity}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-gray-800">
                    {formatRupiah(sale.totalPrice)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-block bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded font-medium">
                      {sale.paymentMethod || 'TUNAI'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-100">
              <tr>
                <td colSpan={3} className="px-4 py-3 font-bold text-right text-gray-700">Total</td>
                <td className="px-4 py-3 text-right font-bold text-gray-800">{formatRupiah(totalOmzet)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );

  // ===== RENDER TAB PRODUK =====
  const renderProduk = () => {
    const productSales: { [key: string]: { name: string; quantity: number; revenue: number } } = {};
    filteredSales.forEach((sale: Sale) => {
      if (sale.items) {
        sale.items.forEach((item: SaleItem) => {
          if (!productSales[item.id]) {
            productSales[item.id] = { name: item.name, quantity: 0, revenue: 0 };
          }
          productSales[item.id].quantity += item.quantity;
          productSales[item.id].revenue += item.price * item.quantity;
        });
      }
    });
    const topProducts = Object.values(productSales).sort((a, b) => b.quantity - a.quantity);

    const soldIds = new Set();
    filteredSales.forEach((sale: Sale) => {
      if (sale.items) {
        sale.items.forEach((item: SaleItem) => soldIds.add(item.id));
      }
    });
    const unsoldProducts = products.filter((p: Product) => !soldIds.has(p.id));

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-sm font-bold text-gray-800">🏆 Produk Terlaris</h3>
            <button 
              onClick={() => exportToExcel(topProducts, 'produk_terlaris', 'produk')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3 py-1.5 rounded-lg flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" /> Ekspor Excel
            </button>
          </div>
          {topProducts.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Package className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>Belum ada produk terjual</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="text-left px-4 py-3 font-bold text-gray-700">#</th>
                    <th className="text-left px-4 py-3 font-bold text-gray-700">Nama Produk</th>
                    <th className="text-right px-4 py-3 font-bold text-gray-700">Terjual</th>
                    <th className="text-right px-4 py-3 font-bold text-gray-700">Pendapatan</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.map((product: any, index: number) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-3 text-gray-700">{index + 1}</td>
                      <td className="px-4 py-3 font-medium text-gray-800">{product.name}</td>
                      <td className="px-4 py-3 text-right font-bold text-gray-800">{product.quantity}</td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-600">{formatRupiah(product.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-sm font-bold text-gray-800">⚠️ Produk Tidak Laku</h3>
            <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-bold">
              {unsoldProducts.length} produk
            </span>
          </div>
          {unsoldProducts.length === 0 ? (
            <div className="text-center py-8 text-emerald-500">
              <p>✅ Semua produk terjual! Bagus!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="text-left px-4 py-3 font-bold text-gray-700">#</th>
                    <th className="text-left px-4 py-3 font-bold text-gray-700">Nama Produk</th>
                    <th className="text-right px-4 py-3 font-bold text-gray-700">Stok</th>
                    <th className="text-right px-4 py-3 font-bold text-gray-700">Harga Jual</th>
                  </tr>
                </thead>
                <tbody>
                  {unsoldProducts.map((product: Product, index: number) => (
                    <tr key={product.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-3 text-gray-700">{index + 1}</td>
                      <td className="px-4 py-3 font-medium text-gray-800">{product.name}</td>
                      <td className="px-4 py-3 text-right text-red-500 font-bold">{product.stock}</td>
                      <td className="px-4 py-3 text-right font-bold text-gray-800">{formatRupiah(product.sellingPrice)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ===== RENDER TAB KEUANGAN =====
  const renderKeuangan = () => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-sm font-bold text-gray-800 mb-4">💰 Laporan Keuangan Detail</h3>
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-blue-50 p-4 rounded-xl">
            <p className="text-sm text-gray-700">Total Pendapatan (Omzet)</p>
            <p className="text-2xl font-bold text-blue-600">{formatRupiah(totalOmzet)}</p>
          </div>
          <div className="bg-orange-50 p-4 rounded-xl">
            <p className="text-sm text-gray-700">Total Modal (HPP)</p>
            <p className="text-2xl font-bold text-orange-600">{formatRupiah(totalModal)}</p>
          </div>
          <div className="bg-red-50 p-4 rounded-xl">
            <p className="text-sm text-gray-700">Total Biaya Operasional</p>
            <p className="text-2xl font-bold text-red-600">{formatRupiah(totalBiaya)}</p>
          </div>
          <div className={`p-4 rounded-xl ${totalLaba >= 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
            <p className="text-sm text-gray-700">Laba Bersih</p>
            <p className={`text-2xl font-bold ${totalLaba >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {formatRupiah(totalLaba)}
            </p>
          </div>
        </div>
        <div className="border-t pt-4">
          <h4 className="font-bold text-sm text-gray-700 mb-2">Detail Perhitungan</h4>
          <div className="bg-gray-50 p-4 rounded-xl text-sm">
            <p className="text-gray-700">
              <span className="font-bold">Rumus:</span> Laba Bersih = Omzet - Modal - Biaya
            </p>
            <p className="text-gray-700 mt-1">
              {formatRupiah(totalLaba)} = {formatRupiah(totalOmzet)} - {formatRupiah(totalModal)} - {formatRupiah(totalBiaya)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  // ===== RENDER TAB BIAYA =====
  const renderBiaya = () => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-sm font-bold text-gray-800">📋 Daftar Biaya Operasional</h3>
        <button 
          onClick={() => exportToExcel(filteredExpenses, 'laporan_biaya', 'biaya')}
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3 py-1.5 rounded-lg flex items-center gap-1"
        >
          <Download className="w-3.5 h-3.5" /> Ekspor Excel
        </button>
      </div>
      {filteredExpenses.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <DollarSign className="w-12 h-12 mx-auto mb-2 text-gray-300" />
          <p>Belum ada biaya operasional dalam periode ini</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-bold text-gray-700">Tanggal</th>
                <th className="text-left px-4 py-3 font-bold text-gray-700">Jenis</th>
                <th className="text-right px-4 py-3 font-bold text-gray-700">Nominal</th>
                <th className="text-left px-4 py-3 font-bold text-gray-700">Catatan</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.map((expense: Expense, index: number) => (
                <tr key={expense.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-3 text-gray-700">{formatDate(expense.timestamp)}</td>
                  <td className="px-4 py-3">
                    <span className="inline-block bg-red-50 text-red-700 text-xs px-2 py-1 rounded font-medium">
                      {expense.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-red-600">
                    {formatRupiah(expense.amount)}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{expense.note || '-'}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-100">
              <tr>
                <td colSpan={2} className="px-4 py-3 font-bold text-right text-gray-700">Total Biaya</td>
                <td className="px-4 py-3 text-right font-bold text-red-600">{formatRupiah(totalBiaya)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );

  // ===== RENDER =====
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-purple-600 text-white p-2.5 rounded-xl shadow-md">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-purple-800 uppercase tracking-tight">Laporan & Analisa</h1>
              <p className="text-xs text-gray-500 font-bold">Semua Laporan dalam Satu Tempat</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href="/">
              <button className="bg-gray-600 hover:bg-gray-700 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5">
                ← KEMBALI
              </button>
            </Link>
            <button type="button" onClick={() => window.print()} className="bg-white hover:bg-gray-100 text-blue-700 font-bold text-xs px-4 py-2 rounded-xl border shadow-sm flex items-center gap-1.5">
              <Printer className="w-4 h-4" /> PRINT
            </button>
          </div>
        </div>

        {/* FILTER TANGGAL */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-bold text-gray-700">Periode:</span>
              <input 
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)} 
                className="border rounded-lg px-3 py-1.5 text-sm text-gray-800"
              />
              <span className="text-gray-400">→</span>
              <input 
                type="date" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)} 
                className="border rounded-lg px-3 py-1.5 text-sm text-gray-800"
              />
            </div>
            <div className="text-sm text-gray-600 font-medium">
              {filteredSales.length} transaksi · {filteredExpenses.length} biaya
            </div>
          </div>
        </div>

        {/* TAB NAVIGATION */}
        <div className="flex flex-wrap gap-2 mb-6 bg-white p-2 rounded-2xl shadow-sm border border-gray-200">
          <button onClick={() => setActiveTab('ringkasan')} className={`px-4 py-2 rounded-xl text-sm font-bold transition ${activeTab === 'ringkasan' ? 'bg-purple-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
            <BarChart3 className="w-4 h-4 inline mr-1" /> Ringkasan
          </button>
          <button onClick={() => setActiveTab('penjualan')} className={`px-4 py-2 rounded-xl text-sm font-bold transition ${activeTab === 'penjualan' ? 'bg-purple-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
            <ShoppingCart className="w-4 h-4 inline mr-1" /> Penjualan
          </button>
          <button onClick={() => setActiveTab('produk')} className={`px-4 py-2 rounded-xl text-sm font-bold transition ${activeTab === 'produk' ? 'bg-purple-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
            <Package className="w-4 h-4 inline mr-1" /> Produk
          </button>
          <button onClick={() => setActiveTab('keuangan')} className={`px-4 py-2 rounded-xl text-sm font-bold transition ${activeTab === 'keuangan' ? 'bg-purple-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
            <DollarSign className="w-4 h-4 inline mr-1" /> Keuangan
          </button>
          <button onClick={() => setActiveTab('biaya')} className={`px-4 py-2 rounded-xl text-sm font-bold transition ${activeTab === 'biaya' ? 'bg-purple-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
            <FileText className="w-4 h-4 inline mr-1" /> Biaya
          </button>
        </div>

        {/* KONTEN TAB */}
        <div>
          {activeTab === 'ringkasan' && renderRingkasan()}
          {activeTab === 'penjualan' && renderPenjualan()}
          {activeTab === 'produk' && renderProduk()}
          {activeTab === 'keuangan' && renderKeuangan()}
          {activeTab === 'biaya' && renderBiaya()}
        </div>

      </div>
    </div>
  );
}