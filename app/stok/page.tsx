"use client";

import React, { useState, useEffect } from 'react';
import { dbLocal, LocalProduct } from '@/lib/dbLocal';
import { Package, Plus, Trash2, ArrowUp, FileSpreadsheet, Download, AlertCircle, Printer, QrCode } from 'lucide-react';
import * as XLSX from 'xlsx';

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

  // State Baru: Modal Cetak Stiker Barcode Mandiri
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

  // FUNGSI: GENERATE BLANKO EXCEL
  const downloadTemplateExcel = () => {
    const templateData = [{ "SKU": "POC-001", "Nama Barang": "Pupuk Organik Cair Super", "Kategori": "Pupuk", "Satuan": "Botol", "Stok": 100, "Harga Beli": 25000, "Harga Jual": 45000 }];
    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template_Stok");
    XLSX.writeFile(workbook, "Blanko_Excel_Stok_Profit_SISUKA.xlsx");
  };

  // FUNGSI: IMPORT EXCEL
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
      await dbLocal.products.add({ id, name, sku, units, stock: Number(stock) || 0, purchasePrice: Number(purchasePrice) || 0, price: Number(sellingPrice) || 0, is_seasonal: isSeasonal, category: category } as any);
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

  // FUNGSI BARU: MEMBUKA MODAL TOMBOL CETAK BARCODE BUATAN SENDIRI
  const openBarcodeModal = (skuCode: string, productName: string) => {
    setActiveBarcodeSku(skuCode);
    setActiveBarcodeName(productName);
    setShowBarcodePrint(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-6 font-sans">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* FORM INPUT MANUAL (Tambahkan info POC Anda di sini) */}
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

        {/* TABEL KATALOG DAN TOMBOL CETAK STIKER BARCODE */}
        <div className="lg:col-span-3 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between print:hidden">
          <div>
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

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Package className="text-emerald-600 w-5 h-5" />
                <h3 className="text-lg font-bold text-gray-800">Daftar Inventori POC</h3>
              </div>
              <div className="flex gap-1.5">
                {['ALL', 'Pupuk', 'Insektisida', 'Fungisida', 'Alat Pertanian'].map(f => (
                  <button key={f} onClick={() => setSelectedFilter(f)} className={`text-[10px] font-bold px-3 py-1.5 rounded-lg border transition ${selectedFilter === f ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}>
                    {f === 'ALL' ? 'SEMUA' : f.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">SKU / Produk</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Kategori</th>
                    <th className="px-4 py-3 text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider">Stok</th>
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
                      <td className="px-4 py-3 text-right text-sm font-bold text-gray-800">Rp {p.price.toLocaleString('id-ID')}</td>
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

      {/* MODAL CETAK BARCODE (BUATAN SENDIRI) */}
      {showBarcodePrint && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 print:hidden">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl">
            <h3 className="text-xl font-black text-gray-800 mb-2 text-center">Cetak Stiker Barcode</h3>
            <p className="text-xs text-gray-400 text-center mb-6 uppercase font-bold tracking-widest">Printer Thermal / Standar</p>
            
            {/* Visualisasi Stiker Barcode */}
            <div id="barcode-sticker" className="border-2 border-dashed border-gray-200 p-6 rounded-2xl mb-8 flex flex-col items-center justify-center bg-gray-50">
               <div className="w-full h-24 bg-white border border-gray-100 rounded-lg flex items-center justify-center mb-3">
                  {/* Di sini nantinya bisa diintegrasikan dengan library react-barcode */}
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