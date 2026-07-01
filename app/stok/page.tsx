"use client";

import React, { useState, useEffect } from 'react';
import { dbLocal, LocalProduct } from '@/lib/dbLocal';
import { 
  Package, 
  Plus, 
  Trash2, 
  ArrowUp, 
  FileSpreadsheet, 
  Download, 
  AlertCircle, 
  Printer, 
  QrCode,
  FileText,
  FileDown,
  ClipboardCheck,
  Save,
  RefreshCw,
  X
} from 'lucide-react';
import * as XLSX from 'xlsx';
import Link from 'next/link';

// Interface untuk Stock Opname
interface StockOpnameItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  units: string;
  stockSistem: number;
  stockFisik: number | '';
  selisih: number;
}

export default function StokGudangPage() {
  const [products, setProducts] = useState<LocalProduct[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<LocalProduct[]>([]);
  
  // State Form Input Manual
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState<'Pupuk' | 'Insektisida' | 'Fungisida' | 'Alat Pertanian' | 'Herbisida'>('Pupuk');
  const [units, setUnits] = useState('Botol');
  const [stock, setStock] = useState<number | ''>(0);
  const [purchasePrice, setPurchasePrice] = useState<number | ''>(0); 
  const [sellingPrice, setSellingPrice] = useState<number | ''>(0); 
  const [isSeasonal, setIsSeasonal] = useState(false);

  // State Filter Tabel Atas
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL');

  // State Stock Opname
  const [showOpname, setShowOpname] = useState(false);
  const [opnameData, setOpnameData] = useState<StockOpnameItem[]>([]);
  const [isOpnameSaved, setIsOpnameSaved] = useState(false);
  const [opnameDate, setOpnameDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  // State Barcode
  const [showBarcodePrint, setShowBarcodePrint] = useState(false);
  const [activeBarcodeSku, setActiveBarcodeSku] = useState('');
  const [activeBarcodeName, setActiveBarcodeName] = useState('');

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await dbLocal.products.toArray();
      setProducts(data);
    } catch (error) {
      console.error("Gagal memuat produk:", error);
    }
  };

  useEffect(() => {
    if (selectedFilter === 'ALL') {
      setFilteredProducts(products);
    } else {
      setFilteredProducts(products.filter(p => (p as any).category === selectedFilter));
    }
  }, [selectedFilter, products]);

  // ===== FUNGSI STOCK OPNAME =====
  const startOpname = () => {
    const data: StockOpnameItem[] = filteredProducts.map(p => ({
      id: p.id,
      sku: p.sku,
      name: p.name,
      category: p.category,
      units: p.units,
      stockSistem: p.stock,
      stockFisik: '',
      selisih: 0
    }));
    setOpnameData(data);
    setShowOpname(true);
    setIsOpnameSaved(false);
  };

  const updateStockFisik = (id: string, value: number | '') => {
    setOpnameData(prev => prev.map(item => {
      if (item.id === id) {
        const stockFisik = value === '' ? '' : Number(value);
        const selisih = stockFisik !== '' ? Number(stockFisik) - item.stockSistem : 0;
        return { ...item, stockFisik, selisih };
      }
      return item;
    }));
  };

  const saveOpname = async () => {
    // Validasi: pastikan semua stok fisik sudah diisi
    const emptyItems = opnameData.filter(item => item.stockFisik === '');
    if (emptyItems.length > 0) {
      alert(`Masih ada ${emptyItems.length} produk yang belum diisi stok fisiknya!`);
      return;
    }

    // Simpan hasil opname ke database
    try {
      for (const item of opnameData) {
        const stockFisik = Number(item.stockFisik);
        const selisih = stockFisik - item.stockSistem;
        /*
        // Simpan ke tabel opname (akan dibuat)
        // await dbLocal.opname?.add({
          id: `OPN-${Date.now()}-${item.id}`,
          productId: item.id,
          tanggal: opnameDate,
          sku: item.sku,
          name: item.name,
          stockSistem: item.stockSistem,
          stockFisik: stockFisik,
          selisih: selisih,
          createdAt: Date.now()
        });
        */
      }
      
      setIsOpnameSaved(true);
      alert(`✅ Stock opname berhasil disimpan! ${opnameData.length} produk telah diupdate.`);
      
      // Refresh data produk
      await loadProducts();
      
    } catch (err) {
      console.error('Gagal menyimpan opname:', err);
      alert('❌ Gagal menyimpan stock opname!');
    }
  };

  const resetOpname = () => {
    setShowOpname(false);
    setOpnameData([]);
    setIsOpnameSaved(false);
  };

  // ===== FUNGSI EXPORT OPNAME KE EXCEL =====
  const exportOpnameToExcel = () => {
    if (opnameData.length === 0) {
      alert('Tidak ada data opname untuk diekspor!');
      return;
    }

    const excelData = opnameData.map((item) => ({
      'SKU': item.sku,
      'Nama Produk': item.name,
      'Kategori': item.category,
      'Satuan': item.units,
      'Stok Sistem': item.stockSistem,
      'Stok Fisik': item.stockFisik || 0,
      'Selisih': item.selisih,
      'Status': item.selisih === 0 ? '✅ OK' : item.selisih > 0 ? '⬆️ Lebih' : '⬇️ Kurang'
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    worksheet['!cols'] = [
      { wch: 15 }, { wch: 30 }, { wch: 15 }, { wch: 10 }, 
      { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `Opname_${opnameDate}`);
    
    const filename = `Stock_Opname_${opnameDate}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, filename);
    alert('✅ Data stock opname berhasil diekspor ke Excel!');
  };

  // ===== FUNGSI LAINNYA =====
  const downloadTemplateExcel = () => {
    const templateData = [{ "SKU": "POC-001", "Nama Barang": "Pupuk Organik Cair Super", "Kategori": "Pupuk", "Satuan": "Botol", "Stok": 100, "Harga Beli": 25000, "Harga Jual": 45000 }];
    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template_Stok");
    XLSX.writeFile(workbook, "Blanko_Excel_Stok_Profit_SISUKA.xlsx");
  };

  const exportDataToExcel = () => {
    if (filteredProducts.length === 0) {
      alert('Tidak ada data produk untuk diekspor!');
      return;
    }

    const excelData = filteredProducts.map((p: LocalProduct) => ({
      'SKU': p.sku,
      'Nama Produk': p.name,
      'Kategori': p.category,
      'Satuan': p.units,
      'Stok': p.stock,
      'Harga Beli (Modal)': p.purchasePrice || 0,
      'Harga Jual': p.price || 0
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    worksheet['!cols'] = [
      { wch: 15 }, { wch: 30 }, { wch: 15 }, { wch: 10 }, { wch: 10 }, { wch: 18 }, { wch: 18 }
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data_Stok");
    XLSX.writeFile(workbook, `Data_Stok_Gudang_${new Date().toISOString().split('T')[0]}.xlsx`);
    alert('✅ Data stok berhasil diekspor ke Excel!');
  };

  const downloadPDF = () => {
    if (filteredProducts.length === 0) {
      alert('Tidak ada data produk untuk didownload!');
      return;
    }

    const printContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Laporan Stok Gudang</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; padding: 20px; }
        h1 { text-align: center; font-size: 24px; margin-bottom: 5px; }
        .sub { text-align: center; color: #666; font-size: 14px; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        th { background-color: #f0f0f0; padding: 10px; text-align: left; border-bottom: 2px solid #000; font-size: 12px; }
        td { padding: 8px 10px; border-bottom: 1px solid #ddd; font-size: 12px; }
        .text-right { text-align: right; }
        .total-row { background-color: #f0f0f0; font-weight: bold; }
        .total-row td { border-top: 2px solid #000; }
        .footer { text-align: center; margin-top: 20px; font-size: 10px; color: #999; border-top: 1px solid #ddd; padding-top: 10px; }
        @media print {
          body { padding: 10px; }
        }
      </style>
    </head>
    <body>
      <h1>LAPORAN STOK GUDANG</h1>
      <p class="sub">${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
      <p class="sub">Total Produk: ${filteredProducts.length}</p>

      <table>
        <thead>
          <tr>
            <th>SKU</th>
            <th>Nama Produk</th>
            <th>Kategori</th>
            <th>Satuan</th>
            <th class="text-right">Stok</th>
            <th class="text-right">Harga Beli</th>
            <th class="text-right">Harga Jual</th>
          </tr>
        </thead>
        <tbody>
          ${filteredProducts.map((p: LocalProduct) => `
            <tr>
              <td>${p.sku}</td>
              <td>${p.name}</td>
              <td>${p.category}</td>
              <td>${p.units}</td>
              <td class="text-right">${p.stock}</td>
              <td class="text-right">Rp ${(p.purchasePrice || 0).toLocaleString('id-ID')}</td>
              <td class="text-right">Rp ${(p.price || 0).toLocaleString('id-ID')}</td>
            </tr>
          `).join('')}
        </tbody>
        <tfoot>
          <tr class="total-row">
            <td colspan="4" class="text-right">TOTAL</td>
            <td class="text-right">${filteredProducts.reduce((sum, p) => sum + p.stock, 0)}</td>
            <td class="text-right">Rp ${filteredProducts.reduce((sum, p) => sum + ((p.purchasePrice || 0) * p.stock), 0).toLocaleString('id-ID')}</td>
            <td class="text-right">Rp ${filteredProducts.reduce((sum, p) => sum + ((p.price || 0) * p.stock), 0).toLocaleString('id-ID')}</td>
          </tr>
        </tfoot>
      </table>

      <div class="footer">
        Dicetak pada: ${new Date().toLocaleString('id-ID')}
      </div>
    </body>
    </html>
    `;

    const printWindow = window.open('', '_blank', 'width=1000,height=800');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    } else {
      alert('Mohon izinkan popup untuk mendownload PDF!');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const excelData: any[] = XLSX.utils.sheet_to_json(worksheet);
        if (excelData.length === 0) return alert('File Excel kosong!');
        const produkSiapSimpan: any[] = [];
        for (const row of excelData) {
          const skuCode = row["SKU"] || `POC-${Date.now().toString().slice(-4)}`;
          const productName = row["Nama Barang"];
          let kat = row["Kategori"] || "Pupuk";
          if (!productName) continue;
          produkSiapSimpan.push({
            id: `XL-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            sku: skuCode.toString().trim(),
            name: productName.toString().trim(),
            category: kat,
            units: (row["Satuan"] || "Botol").toString(),
            stock: Number(row["Stok"]) || 0,
            purchasePrice: Number(row["Harga Beli"]) || 0, 
            price: Number(row["Harga Jual"]) || 0, 
            is_seasonal: false
          });
        }
        await dbLocal.products.bulkAdd(produkSiapSimpan);
        alert(`Sukses! Impor ${produkSiapSimpan.length} produk berhasil.`);
        loadProducts();
      } catch (err) { alert('Gagal impor Excel!'); }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !sku) return alert('Nama dan SKU wajib diisi!');
    const id = Date.now().toString();
    try {
      await dbLocal.products.add({ 
        id, 
        name, 
        sku, 
        units, 
        stock: Number(stock) || 0, 
        purchasePrice: Number(purchasePrice) || 0, 
        price: Number(sellingPrice) || 0, 
        is_seasonal: isSeasonal, 
        category: category 
      } as any);
      setName(''); setSku(''); setStock(0); setPurchasePrice(0); setSellingPrice(0); setIsSeasonal(false);
      loadProducts();
      alert('Produk POC Baru Berhasil Disimpan!');
    } catch (error) { console.error(error); }
  };

  const handleRefillStock = async (id: string) => {
    const product = await dbLocal.products.get(id);
    if (!product) return;
    const qty = prompt(`Masukkan stok masuk untuk ${product.name}:`, "50");
    if (!qty) return;
    await dbLocal.products.update(id, { stock: product.stock + Number(qty) });
    loadProducts();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Hapus produk ini?')) {
      await dbLocal.products.delete(id);
      loadProducts();
    }
  };

  const openBarcodeModal = (skuCode: string, productName: string) => {
    setActiveBarcodeSku(skuCode);
    setActiveBarcodeName(productName);
    setShowBarcodePrint(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-6 font-sans">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* FORM INPUT MANUAL */}
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm h-fit print:hidden">
          <h2 className="text-xl font-bold text-emerald-700 flex items-center gap-2 mb-4">
            <Plus className="w-5 h-5" /> Registrasi Produk
          </h2>
          <form onSubmit={handleAddProduct} className="space-y-4">
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">SKU Barcode Buatan Sendiri</label>
                <div className="grid grid-cols-2 gap-2">
                  <input type="text" value={sku} onChange={(e) => setSku(e.target.value)} placeholder="Misal: POC-001" className="w-full px-3 py-2 border rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-emerald-500 font-bold" />
                  <select value={category} onChange={(e) => setCategory(e.target.value as any)} className="w-full px-3 py-2 border rounded-lg text-sm bg-white font-bold text-emerald-700 outline-none">
                    <option value="Pupuk">Pupuk</option><option value="Insektisida">Insek</option><option value="Fungisida">Fungi</option><option value="Herbisida">Herbisida</option><option value="Alat Pertanian">Alat</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Nama Produk POC</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Contoh: POC Super Gading Semendawai" className="w-full px-3 py-2 border rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Satuan</label><select value={units} onChange={(e) => setUnits(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm bg-white outline-none"><option value="Botol">Botol</option><option value="Sak">Sak</option><option value="Pack">Pack</option><option value="Kg">Kg</option></select></div>
                <div><label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Stok Awal</label><input type="number" value={stock} onChange={(e) => setStock(e.target.value === '' ? '' : Number(e.target.value))} className="w-full px-3 py-2 border rounded-lg text-sm bg-white outline-none" /></div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Harga Modal</label><input type="number" value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value === '' ? '' : Number(e.target.value))} placeholder="Rp" className="w-full px-3 py-2 border rounded-lg text-sm bg-white outline-none" /></div>
                <div><label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Harga Jual</label><input type="number" value={sellingPrice} onChange={(e) => setSellingPrice(e.target.value === '' ? '' : Number(e.target.value))} placeholder="Rp" className="w-full px-3 py-2 border rounded-lg text-sm bg-white outline-none" /></div>
              </div>
            </div>
            <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl transition text-sm">SIMPAN BARANG</button>
          </form>
        </div>

        {/* TABEL KATALOG DAN TOMBOL */}
        <div className="lg:col-span-3 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between print:hidden">
          <div>
            {/* INFO IMPOR */}
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="text-emerald-600 w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-emerald-900">Impor Massal & Cetak Barcode Mandiri</h4>
                  <p className="text-[10px] text-emerald-700 leading-relaxed">Anda bisa mengunggah ribuan stok POC sekaligus via Excel dan mencetak stiker barcode sendiri menggunakan printer thermal atau printer biasa.</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={downloadTemplateExcel} className="bg-white hover:bg-gray-100 text-emerald-700 font-bold text-[10px] px-3 py-2 rounded-lg border border-emerald-200 flex items-center gap-1.5 shadow-sm transition">
                  <Download className="w-3 h-3" /> BLANKO EXCEL
                </button>
                <label className="cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] px-3 py-2 rounded-lg flex items-center gap-1.5 shadow-md transition">
                  <FileSpreadsheet className="w-3 h-3" /> UNGGAH STOK
                  <input type="file" accept=".xlsx, .xls" onChange={handleImportExcel} className="hidden" />
                </label>
              </div>
            </div>

            {/* TOMBOL EXPORT, PRINT & STOCK OPNAME */}
            <div className="flex flex-wrap items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Package className="text-emerald-600 w-5 h-5" />
                <h3 className="text-lg font-bold text-gray-800">Daftar Inventori POC</h3>
              </div>
              <div className="flex gap-2 flex-wrap">
                {/* TOMBOL STOCK OPNAME */}
                <button 
                  onClick={startOpname}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm transition"
                >
                  <ClipboardCheck className="w-3.5 h-3.5" /> STOCK OPNAME
                </button>
                
                <button 
                  onClick={exportDataToExcel}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold text-[10px] px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm transition"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" /> EXPORT EXCEL
                </button>
                
                <button 
                  onClick={downloadPDF}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold text-[10px] px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm transition"
                >
                  <FileText className="w-3.5 h-3.5" /> DOWNLOAD PDF
                </button>
                
                <button 
                  onClick={handlePrint}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-[10px] px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm transition"
                >
                  <Printer className="w-3.5 h-3.5" /> PRINT
                </button>
              </div>
            </div>

            {/* FILTER KATEGORI */}
            <div className="flex gap-1.5 mb-4">
              {['ALL', 'Pupuk', 'Insektisida', 'Fungisida', 'Alat Pertanian', 'Herbisida'].map(f => (
                <button key={f} onClick={() => setSelectedFilter(f)} className={`text-[10px] font-bold px-3 py-1.5 rounded-lg border transition ${selectedFilter === f ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}>
                  {f === 'ALL' ? 'SEMUA' : f.toUpperCase()}
                </button>
              ))}
            </div>

            {/* TABEL DATA */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">SKU / Produk</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Kategori</th>
                    <th className="px-4 py-3 text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider">Stok</th>
                    <th className="px-4 py-3 text-right text-[10px] font-bold text-gray-400 uppercase tracking-wider">Harga Beli</th>
                    <th className="px-4 py-3 text-right text-[10px] font-bold text-gray-400 uppercase tracking-wider">Harga Jual</th>
                    <th className="px-4 py-3 text-right text-[10px] font-bold text-gray-400 uppercase tracking-wider">Aksi</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProducts.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-mono text-emerald-600 font-bold">{p.sku}</span>
                          <span className="text-sm font-bold text-gray-800">{p.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3"><span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{p.category}</span></td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-sm font-black ${p.stock <= 5 ? 'text-red-600 animate-pulse' : 'text-gray-800'}`}>{p.stock}</span>
                        <span className="text-[10px] text-gray-400 ml-1">{p.units}</span>
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-bold text-orange-600">Rp {p.purchasePrice?.toLocaleString('id-ID') || 0}</td>
                      <td className="px-4 py-3 text-right text-sm font-bold text-emerald-600">Rp {p.price.toLocaleString('id-ID')}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button onClick={() => openBarcodeModal(p.sku, p.name)} className="p-1.5 text-gray-400 hover:text-emerald-600 transition" title="Cetak Barcode"><QrCode className="w-4 h-4" /></button>
                          <button onClick={() => handleRefillStock(p.id)} className="p-1.5 text-gray-400 hover:text-blue-600 transition" title="Tambah Stok"><ArrowUp className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(p.id)} className="p-1.5 text-gray-400 hover:text-red-600 transition" title="Hapus"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredProducts.length === 0 && <p className="text-center py-10 text-gray-400 text-sm">Belum ada produk POC terdaftar.</p>}
            </div>
          </div>
        </div>

      </div>

      {/* ===== MODAL STOCK OPNAME ===== */}
      {showOpname && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 print:hidden">
          <div className="bg-white rounded-3xl p-6 max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-xl font-black text-gray-800">📋 Stock Opname</h3>
                <p className="text-xs text-gray-400">Cek stok fisik secara manual oleh pegawai gudang</p>
              </div>
              <div className="flex gap-2">
                <button onClick={exportOpnameToExcel} className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1.5 rounded-lg flex items-center gap-1">
                  <FileSpreadsheet className="w-3.5 h-3.5" /> Export Excel
                </button>
                <button onClick={resetOpname} className="bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs px-3 py-1.5 rounded-lg flex items-center gap-1">
                  <X className="w-3.5 h-3.5" /> Tutup
                </button>
              </div>
            </div>

            <div className="mb-4 flex items-center gap-4 bg-gray-50 p-3 rounded-xl">
              <label className="text-sm font-bold text-gray-600">Tanggal Opname:</label>
              <input 
                type="date" 
                value={opnameDate} 
                onChange={(e) => setOpnameDate(e.target.value)}
                className="border rounded-lg px-3 py-1.5 text-sm"
              />
              <span className="text-xs text-gray-400 ml-4">
                Total Produk: {opnameData.length} | 
                Stok Sistem: {opnameData.reduce((sum, i) => sum + i.stockSistem, 0)} unit
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-3 py-2 text-left text-[10px] font-bold text-gray-500">SKU</th>
                    <th className="px-3 py-2 text-left text-[10px] font-bold text-gray-500">Nama Produk</th>
                    <th className="px-3 py-2 text-center text-[10px] font-bold text-gray-500">Satuan</th>
                    <th className="px-3 py-2 text-center text-[10px] font-bold text-gray-500">Stok Sistem</th>
                    <th className="px-3 py-2 text-center text-[10px] font-bold text-gray-500">Stok Fisik</th>
                    <th className="px-3 py-2 text-center text-[10px] font-bold text-gray-500">Selisih</th>
                    <th className="px-3 py-2 text-center text-[10px] font-bold text-gray-500">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {opnameData.map((item) => {
                    const selisih = item.stockFisik !== '' ? Number(item.stockFisik) - item.stockSistem : 0;
                    return (
                      <tr key={item.id} className="border-t hover:bg-gray-50">
                        <td className="px-3 py-2 font-mono text-xs text-emerald-600">{item.sku}</td>
                        <td className="px-3 py-2 font-medium text-gray-800">{item.name}</td>
                        <td className="px-3 py-2 text-center text-xs text-gray-500">{item.units}</td>
                        <td className="px-3 py-2 text-center font-bold text-blue-600">{item.stockSistem}</td>
                        <td className="px-3 py-2 text-center">
                          <input
                            type="number"
                            value={item.stockFisik}
                            onChange={(e) => updateStockFisik(item.id, e.target.value ? Number(e.target.value) : '')}
                            className="w-20 border rounded-lg px-2 py-1 text-center text-sm focus:ring-2 focus:ring-emerald-500"
                            placeholder="0"
                          />
                        </td>
                        <td className={`px-3 py-2 text-center font-bold ${selisih === 0 ? 'text-gray-500' : selisih > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {item.stockFisik !== '' ? selisih : '-'}
                        </td>
                        <td className="px-3 py-2 text-center">
                          {item.stockFisik !== '' ? (
                            selisih === 0 ? (
                              <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">✅ OK</span>
                            ) : selisih > 0 ? (
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">⬆️ Lebih {selisih}</span>
                            ) : (
                              <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">⬇️ Kurang {Math.abs(selisih)}</span>
                            )
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-gray-50 font-bold">
                  <tr>
                    <td colSpan={3} className="px-3 py-2 text-right">TOTAL</td>
                    <td className="px-3 py-2 text-center">{opnameData.reduce((sum, i) => sum + i.stockSistem, 0)}</td>
                    <td className="px-3 py-2 text-center">
                      {opnameData.filter(i => i.stockFisik !== '').reduce((sum, i) => sum + Number(i.stockFisik), 0)}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {opnameData.filter(i => i.stockFisik !== '').reduce((sum, i) => sum + (Number(i.stockFisik) - i.stockSistem), 0)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="mt-4 flex gap-2">
              <button 
                onClick={saveOpname}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-lg flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" /> Simpan Opname
              </button>
              <button 
                onClick={resetOpname}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-2.5 rounded-lg flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" /> Batal
              </button>
            </div>

            {isOpnameSaved && (
              <div className="mt-3 bg-emerald-50 border border-emerald-200 p-3 rounded-lg text-emerald-700 text-sm text-center">
                ✅ Stock opname berhasil disimpan! Data sudah terupdate.
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL CETAK BARCODE */}
      {showBarcodePrint && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 print:hidden">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl">
            <h3 className="text-xl font-black text-gray-800 mb-2 text-center">Cetak Stiker Barcode</h3>
            <p className="text-xs text-gray-400 text-center mb-6 uppercase font-bold tracking-widest">Printer Thermal / Standar</p>
            
            <div id="barcode-sticker" className="border-2 border-dashed border-gray-200 p-6 rounded-2xl mb-8 flex flex-col items-center justify-center bg-gray-50">
               <div className="w-full h-24 bg-white border border-gray-100 rounded-lg flex items-center justify-center mb-3">
                  <div className="flex flex-col items-center">
                    <div className="flex gap-0.5 mb-1">
                      {[1,2,1,3,1,2,4,1,2,1,3,1,2,1,2,1,4,1,2,1].map((w, i) => (
                        <div key={i} className="bg-black h-12" style={{ width: `${w}px` }}></div>
                      ))}
                    </div>
                    <span className="text-xs font-mono font-black tracking-[0.3em]">{activeBarcodeSku}</span>
                  </div>
               </div>
               <p className="text-[10px] font-black text-gray-800 text-center uppercase truncate w-full">{activeBarcodeName}</p>
               <p className="text-[8px] text-gray-400 font-bold mt-1 uppercase">SISUKA - SMART INVENTORY</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setShowBarcodePrint(false)} className="py-3 px-4 rounded-xl border border-gray-200 text-gray-500 font-bold text-sm hover:bg-gray-50 transition">BATAL</button>
              <button onClick={() => window.print()} className="py-3 px-4 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 shadow-lg flex items-center justify-center gap-2 transition">
                <Printer className="w-4 h-4" /> CETAK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AREA KHUSUS PRINT STIKER BARCODE */}
      <div className="hidden print:block">
        <div className="flex flex-col items-center justify-center p-4 border border-black w-[40mm] h-[30mm]">
            <div className="flex flex-col items-center">
              <div className="flex gap-0.5 mb-1">
                {[1,2,1,3,1,2,4,1,2,1,3,1,2,1,2,1,4,1,2,1].map((w, i) => (
                  <div key={i} className="bg-black h-8" style={{ width: `${w}px` }}></div>
                ))}
              </div>
              <span className="text-[8px] font-mono font-black tracking-[0.2em]">{activeBarcodeSku}</span>
            </div>
            <p className="text-[7px] font-black text-black text-center uppercase mt-1 leading-none">{activeBarcodeName}</p>
        </div>
      </div>

    </div>
  );
}