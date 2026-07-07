"use client";

import React, { useState, useEffect } from 'react';
import { dbLocal, LocalProduct, DynamicCategory } from '@/lib/dbLocal';
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
  ClipboardCheck,
  Save,
  RefreshCw,
  X,
  Building2,
  MapPin,
  AlertTriangle,
  CheckCircle,
  CircleAlert
} from 'lucide-react';
import * as XLSX from 'xlsx';

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

// Interface untuk Supplier
interface Supplier {
  id: string;
  name: string;
  contact: string;
  phone: string;
  address: string;
}

export default function StokGudangPage() {
  const [products, setProducts] = useState<LocalProduct[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<LocalProduct[]>([]);
  const [categories, setCategories] = useState<DynamicCategory[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  
  // State Form Input Manual (diperluas)
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('');
  const [units, setUnits] = useState('Botol');
  const [stock, setStock] = useState<number | ''>(0);
  const [purchasePrice, setPurchasePrice] = useState<number | ''>(0); 
  const [sellingPrice, setSellingPrice] = useState<number | ''>(0);
  const [supplier, setSupplier] = useState('');
  const [minStock, setMinStock] = useState<number | ''>(5);
  const [location, setLocation] = useState('');
  const [isSeasonal, setIsSeasonal] = useState(false);

  // State Filter Tabel
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

  // State Tambahan
  const [selectedSupplier, setSelectedSupplier] = useState<string>('ALL');
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState('');
  const [newSupplierContact, setNewSupplierContact] = useState('');
  const [newSupplierPhone, setNewSupplierPhone] = useState('');
  // State Satuan 
  const [unitList, setUnitList] = useState<string[]>(['Botol', 'Sak', 'Pack', 'Kg']);
  const [showAddUnitModal, setShowAddUnitModal] = useState(false);
  const [newUnitName, setNewUnitName] = useState(''); 
  // State Kategori
const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
const [newCategoryName, setNewCategoryName] = useState('');
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Ambil semua data dari database
      const allProducts = await dbLocal.products.toArray();
      const catData = await dbLocal.categories.toArray();
      
      // === MIGRASI DATA LAMA (CUKUP 1 KALI) ===
      let updatedCount = 0;
      for (const product of allProducts) {
        // Cek apakah produk punya field baru
        if (product.supplier === undefined || 
            product.minStock === undefined || 
            product.location === undefined) {
          // Tambahkan field baru dengan default value
          await dbLocal.products.update(product.id, {
            supplier: product.supplier || '',
            minStock: product.minStock || 5,
            location: product.location || ''
          });
          updatedCount++;
        }
      }
      
      if (updatedCount > 0) {
        console.log(`✅ Migrasi selesai! ${updatedCount} produk diupdate.`);
      }
      
      // Ambil data terbaru setelah migrasi
      const updatedProducts = await dbLocal.products.toArray();
      
      // Set state dengan data terbaru
      setProducts(updatedProducts);
      setCategories(catData);
      
    } catch (error) {
      console.error("Gagal memuat data:", error);
    }
  };

  // Filter produk berdasarkan kategori dan supplier
  useEffect(() => {
    let filtered = products;
    
    if (selectedFilter !== 'ALL') {
      filtered = filtered.filter(p => p.category === selectedFilter);
    }
    
    if (selectedSupplier !== 'ALL') {
      filtered = filtered.filter(p => (p as any).supplier === selectedSupplier);
    }
    
    setFilteredProducts(filtered);
  }, [selectedFilter, selectedSupplier, products]);

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
    const emptyItems = opnameData.filter(item => item.stockFisik === '');
    if (emptyItems.length > 0) {
      alert(`Masih ada ${emptyItems.length} produk yang belum diisi stok fisiknya!`);
      return;
    }

    try {
      for (const item of opnameData) {
        const stockFisik = Number(item.stockFisik);
        await dbLocal.products.update(item.id, { stock: stockFisik });
      }
      setIsOpnameSaved(true);
      alert(`✅ Stock opname berhasil disimpan! ${opnameData.length} produk telah diupdate.`);
      await loadData();
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
    XLSX.writeFile(workbook, `Stock_Opname_${opnameDate}_${new Date().toISOString().split('T')[0]}.xlsx`);
    alert('✅ Data stock opname berhasil diekspor ke Excel!');
  };

  // ===== FUNGSI LAINNYA =====
  const downloadTemplateExcel = () => {
    const templateData = [{ 
      "SKU": "POC-001", 
      "Nama Barang": "Pupuk Organik Cair Super", 
      "Kategori": "Pupuk", 
      "Satuan": "Botol", 
      "Stok": 100, 
      "Harga Beli": 25000, 
      "Harga Jual": 45000,
      "Supplier": "PT Agro Makmur",
      "Min Stok": 20,
      "Lokasi Rak": "A1-B3"
    }];
    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template_Stok");
    XLSX.writeFile(workbook, "Blanko_Excel_Stok_SISUKA.xlsx");
  };

  const exportDataToExcel = () => {
    if (filteredProducts.length === 0) {
      alert('Tidak ada data produk untuk diekspor!');
      return;
    }

    const excelData = filteredProducts.map((p: any) => ({
      'SKU': p.sku,
      'Nama Produk': p.name,
      'Kategori': p.category,
      'Satuan': p.units,
      'Stok': p.stock,
      'Min Stok': p.minStock || 0,
      'Status Stok': getStockStatus(p.stock, p.minStock || 5),
      'Supplier': p.supplier || '-',
      'Lokasi Rak': p.location || '-',
      'Harga Beli': p.purchasePrice || 0,
      'Harga Jual': p.price || 0
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    worksheet['!cols'] = [
      { wch: 15 }, { wch: 30 }, { wch: 15 }, { wch: 10 }, 
      { wch: 10 }, { wch: 10 }, { wch: 15 }, { wch: 15 },
      { wch: 15 }, { wch: 18 }, { wch: 18 }
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data_Stok");
    XLSX.writeFile(workbook, `Data_Stok_Gudang_${new Date().toISOString().split('T')[0]}.xlsx`);
    alert('✅ Data stok berhasil diekspor ke Excel!');
  };

  const getStockStatus = (stock: number, minStock: number): string => {
    if (stock <= 0) return 'Habis';
    if (stock < minStock) return 'Menipis';
    return 'Aman';
  };

  const getStockStatusColor = (stock: number, minStock: number): string => {
    const status = getStockStatus(stock, minStock);
    if (status === 'Habis') return 'bg-red-100 text-red-700';
    if (status === 'Menipis') return 'bg-yellow-100 text-yellow-700';
    return 'bg-green-100 text-green-700';
  };

  const getStockStatusIcon = (stock: number, minStock: number) => {
    const status = getStockStatus(stock, minStock);
    if (status === 'Habis') return <CircleAlert className="w-3.5 h-3.5" />;
    if (status === 'Menipis') return <AlertTriangle className="w-3.5 h-3.5" />;
    return <CheckCircle className="w-3.5 h-3.5" />;
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
        table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 10px; }
        th { background-color: #f0f0f0; padding: 8px; text-align: left; border-bottom: 2px solid #000; }
        td { padding: 6px 8px; border-bottom: 1px solid #ddd; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .total-row { background-color: #f0f0f0; font-weight: bold; }
        .total-row td { border-top: 2px solid #000; }
        .footer { text-align: center; margin-top: 20px; font-size: 10px; color: #999; border-top: 1px solid #ddd; padding-top: 10px; }
        .status-aman { color: green; }
        .status-menipis { color: orange; }
        .status-habis { color: red; }
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
            <th>Supplier</th>
            <th>Lokasi</th>
            <th class="text-right">Stok</th>
            <th class="text-center">Status</th>
            <th class="text-right">Harga Beli</th>
            <th class="text-right">Harga Jual</th>
          </tr>
        </thead>
        <tbody>
          ${filteredProducts.map((p: any) => {
            const status = getStockStatus(p.stock, p.minStock || 5);
            const statusClass = status === 'Aman' ? 'status-aman' : status === 'Menipis' ? 'status-menipis' : 'status-habis';
            return `
            <tr>
              <td>${p.sku}</td>
              <td>${p.name}</td>
              <td>${p.category}</td>
              <td>${p.supplier || '-'}</td>
              <td>${p.location || '-'}</td>
              <td class="text-right">${p.stock}</td>
              <td class="text-center ${statusClass}">${status}</td>
              <td class="text-right">Rp ${(p.purchasePrice || 0).toLocaleString('id-ID')}</td>
              <td class="text-right">Rp ${(p.price || 0).toLocaleString('id-ID')}</td>
            </tr>
          `}).join('')}
        </tbody>
        <tfoot>
          <tr class="total-row">
            <td colspan="5" class="text-right">TOTAL</td>
            <td class="text-right">${filteredProducts.reduce((sum, p) => sum + p.stock, 0)}</td>
            <td></td>
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

    const printWindow = window.open('', '_blank', 'width=1100,height=900');
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
          if (!productName) continue;
          
          produkSiapSimpan.push({
            id: `XL-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            sku: skuCode.toString().trim(),
            name: productName.toString().trim(),
            category: row["Kategori"] || "Pupuk",
            units: (row["Satuan"] || "Botol").toString(),
            stock: Number(row["Stok"]) || 0,
            purchasePrice: Number(row["Harga Beli"]) || 0, 
            price: Number(row["Harga Jual"]) || 0,
            supplier: row["Supplier"] || "",
            minStock: Number(row["Min Stok"]) || 5,
            location: row["Lokasi Rak"] || "",
            is_seasonal: false
          });
        }
        await dbLocal.products.bulkAdd(produkSiapSimpan);
        alert(`Sukses! Impor ${produkSiapSimpan.length} produk berhasil.`);
        loadData();
      } catch (err) { 
        console.error(err);
        alert('Gagal impor Excel!'); 
      }
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
        supplier: supplier,
        minStock: Number(minStock) || 5,
        location: location,
        is_seasonal: isSeasonal, 
        category: category 
      } as any);
      
      // Reset form
      setName(''); 
      setSku(''); 
      setStock(0); 
      setPurchasePrice(0); 
      setSellingPrice(0);
      setSupplier('');
      setMinStock(5);
      setLocation('');
      setIsSeasonal(false);
      
      loadData();
      alert('✅ Produk baru berhasil disimpan!');
    } catch (error) { 
      console.error(error);
      alert('❌ Gagal menyimpan produk!');
    }
  };

  const handleRefillStock = async (id: string) => {
    const product = await dbLocal.products.get(id);
    if (!product) return;
    const qty = prompt(`Masukkan stok masuk untuk ${product.name}:`, "50");
    if (!qty) return;
    await dbLocal.products.update(id, { stock: product.stock + Number(qty) });
    loadData();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Hapus produk ini?')) {
      await dbLocal.products.delete(id);
      loadData();
    }
  };

  const openBarcodeModal = (skuCode: string, productName: string) => {
    setActiveBarcodeSku(skuCode);
    setActiveBarcodeName(productName);
    setShowBarcodePrint(true);
  };

  // Tambahan: Fungsi untuk Supplier
  const handleAddSupplier = async () => {
    if (!newSupplierName) return alert('Nama supplier wajib diisi!');
    // Tambahkan ke database supplier
    // const newSupplier = { id: Date.now().toString(), name: newSupplierName, contact: newSupplierContact, phone: newSupplierPhone };
    // await dbLocal.suppliers.add(newSupplier);
    // loadData();
    setShowAddSupplier(false);
    setNewSupplierName('');
    setNewSupplierContact('');
    setNewSupplierPhone('');
    alert('✅ Supplier berhasil ditambahkan!');
  };

// Fungsi untuk tambah Satuan
const handleAddUnit = () => {
  if (!newUnitName.trim()) return alert('Nama satuan wajib diisi!');
  if (unitList.includes(newUnitName.trim())) {
    return alert('Satuan sudah ada!');
  }
  setUnitList([...unitList, newUnitName.trim()]);
  setNewUnitName('');
  setShowAddUnitModal(false);
  alert(`✅ Satuan "${newUnitName.trim()}" berhasil ditambahkan!`); // ← PAKAI BACKTICK!
};

  // ===== RENDER =====
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-4 font-sans">

      {/* ================= HEADER ERP ================= */}
      <div className="max-w-7xl mx-auto mb-4">
        <div className="bg-gradient-to-r from-emerald-700 to-emerald-600 rounded-xl p-5 shadow-lg text-white">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <div className="flex items-center gap-3">
                <Package className="w-8 h-8" />
                <div>
                  <h1 className="text-2xl font-black tracking-tight">INVENTORI & STOK</h1>
                  <p className="text-emerald-100 text-sm">Sistem Manajemen Persediaan • SISUKA ERP</p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-lg">SISUKA ERP</p>
              <p className="text-xs text-emerald-200">Offline ERP System v2.0</p>
            </div>
          </div>
        </div>
      </div>

      {/* ================= DASHBOARD RINGKAS ================= */}
      <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-xs text-gray-500 font-medium">Total Barang</p>
          <h2 className="text-2xl font-black text-emerald-700">
            {products.length}
          </h2>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-xs text-gray-500 font-medium">Supplier</p>
          <h2 className="text-2xl font-black text-blue-600">
            {suppliers.length || 0}
          </h2>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-xs text-gray-500 font-medium">Stok Menipis</p>
          <h2 className="text-2xl font-black text-orange-600">
            {products.filter(p => p.stock > 0 && p.stock < ((p as any).minStock || 5)).length}
          </h2>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-xs text-gray-500 font-medium">Nilai Persediaan</p>
          <h2 className="text-lg font-black text-purple-600">
            Rp {products.reduce((sum, p) => sum + ((p.purchasePrice || 0) * p.stock), 0).toLocaleString('id-ID')}
          </h2>
        </div>
      </div>

      {/* ================= MAIN CONTENT ================= */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-5">
        
        {/* ===== FORM MASTER BARANG (DIPERLUAS) ===== */}
        <div className="lg:col-span-1 bg-white p-5 rounded-xl border border-gray-200 shadow-sm h-fit print:hidden">
          <h2 className="text-lg font-bold text-emerald-700 flex items-center gap-2 mb-4">
            <Plus className="w-5 h-5" /> Master Barang
          </h2>
          
          <form onSubmit={handleAddProduct} className="space-y-3">
            {/* SKU & Kategori */}
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">SKU & Kategori</label>
             <div>
  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">SKU & Kategori</label>
  <div className="grid grid-cols-2 gap-2">
    <input 
      type="text" 
      value={sku} 
      onChange={(e) => setSku(e.target.value)} 
      placeholder="SKU" 
      className="w-full px-3 py-2 border rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-emerald-500 font-mono" 
    />
    <div className="flex gap-1">
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="flex-1 px-3 py-2 border rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-emerald-500"
        required
      >
        <option value="">Kategori</option>
        {categories.map((cat) => (
          <option key={cat.id} value={cat.name}>{cat.name}</option>
        ))}
      </select>
      <button 
        type="button"
        onClick={() => setShowAddCategoryModal(true)}
        className="px-3 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-lg text-sm font-bold transition"
      >
        +
      </button>
    </div>
  </div>
</div>

            </div>

            {/* Nama Produk */}
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Nama Produk</label>
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="Nama produk..." 
                className="w-full px-3 py-2 border rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-emerald-500" 
              />
            </div>

                       {/* Satuan & Stok */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Satuan</label>
                <div className="flex gap-1">
                  <select 
                    value={units} 
                    onChange={(e) => setUnits(e.target.value)} 
                    className="flex-1 px-3 py-2 border rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {unitList.map((unit) => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>
                  <button 
                    type="button"
                    onClick={() => setShowAddUnitModal(true)}
                    className="px-3 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-lg text-sm font-bold transition"
                  >
                    +
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Stok Awal</label>
                <input type="number" value={stock} onChange={(e) => setStock(e.target.value === '' ? '' : Number(e.target.value))} className="w-full px-3 py-2 border rounded-lg text-sm bg-white outline-none" />
              </div>
            </div>

            {/* Harga */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Harga Modal</label>
                <input type="number" value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value === '' ? '' : Number(e.target.value))} placeholder="Rp" className="w-full px-3 py-2 border rounded-lg text-sm bg-white outline-none" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Harga Jual</label>
                <input type="number" value={sellingPrice} onChange={(e) => setSellingPrice(e.target.value === '' ? '' : Number(e.target.value))} placeholder="Rp" className="w-full px-3 py-2 border rounded-lg text-sm bg-white outline-none" />
              </div>
            </div>

            {/* Supplier, Min Stok, Lokasi Rak - BARU! */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Supplier</label>
                <div className="flex gap-1">
                  <select 
                    value={supplier} 
                    onChange={(e) => setSupplier(e.target.value)}
                    className="flex-1 px-3 py-2 border rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Pilih Supplier</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                  <button 
                    type="button"
                    onClick={() => setShowAddSupplier(true)}
                    className="px-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-lg text-sm font-bold transition"
                  >
                    +
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Min Stok</label>
                <input 
                  type="number" 
                  value={minStock} 
                  onChange={(e) => setMinStock(e.target.value === '' ? '' : Number(e.target.value))} 
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-emerald-500" 
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Lokasi Rak</label>
              <input 
                type="text" 
                value={location} 
                onChange={(e) => setLocation(e.target.value)} 
                placeholder="Contoh: A1-B3" 
                className="w-full px-3 py-2 border rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-emerald-500" 
              />
            </div>

            <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-lg transition text-sm shadow-md">
              SIMPAN BARANG
            </button>
          </form>
        </div>

        {/* ===== TOOLBAR & TABEL ===== */}
        <div className="lg:col-span-3 bg-white p-5 rounded-xl border border-gray-200 shadow-sm print:hidden">
          
          {/* TOOLBAR PROFESIONAL */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <Package className="text-emerald-600 w-5 h-5" />
              <h3 className="text-lg font-bold text-gray-800">Daftar Inventori</h3>
              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-bold">
                {filteredProducts.length}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button 
                onClick={startOpname}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm transition"
              >
                <ClipboardCheck className="w-3.5 h-3.5" /> Opname
              </button>
              <button 
                onClick={exportDataToExcel}
                className="bg-green-600 hover:bg-green-700 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm transition"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" /> Excel
              </button>
              <button 
                onClick={downloadPDF}
                className="bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm transition"
              >
                <FileText className="w-3.5 h-3.5" /> PDF
              </button>
              <button 
                onClick={handlePrint}
                className="bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm transition"
              >
                <Printer className="w-3.5 h-3.5" /> Print
              </button>
              <label className="cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm transition">
                <FileSpreadsheet className="w-3.5 h-3.5" /> Import
                <input type="file" accept=".xlsx, .xls" onChange={handleImportExcel} className="hidden" />
              </label>
            </div>
          </div>

          {/* FILTER */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="text-[10px] font-bold text-gray-400 uppercase">Filter:</span>
            <button 
              onClick={() => setSelectedFilter('ALL')} 
              className={`text-[10px] font-bold px-3 py-1 rounded-lg border transition ${
                selectedFilter === 'ALL' 
                  ? 'bg-emerald-600 border-emerald-600 text-white' 
                  : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
              }`}
            >
              SEMUA
            </button>
            {categories.map((cat) => (
              <button 
                key={cat.id} 
                onClick={() => setSelectedFilter(cat.name)} 
                className={`text-[10px] font-bold px-3 py-1 rounded-lg border transition ${
                  selectedFilter === cat.name 
                    ? 'bg-emerald-600 border-emerald-600 text-white' 
                    : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                }`}
              >
                {cat.name.toUpperCase()}
              </button>
            ))}
          </div>

          {/* TABEL INVENTORI */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2.5 text-left text-[9px] font-bold text-gray-400 uppercase tracking-wider">SKU / Produk</th>
                  <th className="px-3 py-2.5 text-left text-[9px] font-bold text-gray-400 uppercase tracking-wider">Supplier</th>
                  <th className="px-3 py-2.5 text-left text-[9px] font-bold text-gray-400 uppercase tracking-wider">Lokasi</th>
                  <th className="px-3 py-2.5 text-center text-[9px] font-bold text-gray-400 uppercase tracking-wider">Min</th>
                  <th className="px-3 py-2.5 text-center text-[9px] font-bold text-gray-400 uppercase tracking-wider">Stok</th>
                  <th className="px-3 py-2.5 text-center text-[9px] font-bold text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-3 py-2.5 text-right text-[9px] font-bold text-gray-400 uppercase tracking-wider">Harga</th>
                  <th className="px-3 py-2.5 text-center text-[9px] font-bold text-gray-400 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filteredProducts.map((p: any) => {
                  const minStock = p.minStock || 5;
                  const status = getStockStatus(p.stock, minStock);
                  const statusColor = getStockStatusColor(p.stock, minStock);
                  return (
                    <tr key={p.id} className="hover:bg-gray-50 transition">
                      <td className="px-3 py-2.5">
                        <div className="flex flex-col">
                          <span className="text-[9px] font-mono text-emerald-600 font-bold">{p.sku}</span>
                          <span className="text-sm font-bold text-gray-800 truncate max-w-[120px]">{p.name}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-xs text-gray-600">
                        {p.supplier || '-'}
                      </td>
                      <td className="px-3 py-2.5 text-xs text-gray-600">
                        {p.location || '-'}
                      </td>
                      <td className="px-3 py-2.5 text-center text-xs font-bold text-gray-500">
                        {minStock}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <span className={`text-sm font-black ${p.stock <= 0 ? 'text-red-600' : p.stock < minStock ? 'text-yellow-600' : 'text-gray-800'}`}>
                          {p.stock}
                        </span>
                        <span className="text-[9px] text-gray-400 ml-0.5">{p.units}</span>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${statusColor}`}>
                          {getStockStatusIcon(p.stock, minStock)}
                          {status}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <div className="text-[10px]">
                          <div className="text-orange-600 font-bold">Rp {p.purchasePrice?.toLocaleString('id-ID') || 0}</div>
                          <div className="text-emerald-600 font-bold">Rp {p.price.toLocaleString('id-ID')}</div>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button 
                            onClick={() => openBarcodeModal(p.sku, p.name)} 
                            className="p-1 text-gray-400 hover:text-emerald-600 transition rounded hover:bg-emerald-50" 
                            title="Cetak Barcode"
                          >
                            <QrCode className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleRefillStock(p.id)} 
                            className="p-1 text-gray-400 hover:text-blue-600 transition rounded hover:bg-blue-50" 
                            title="Tambah Stok"
                          >
                            <ArrowUp className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(p.id)} 
                            className="p-1 text-gray-400 hover:text-red-600 transition rounded hover:bg-red-50" 
                            title="Hapus"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredProducts.length === 0 && (
              <p className="text-center py-10 text-gray-400 text-sm">Belum ada produk terdaftar.</p>
            )}
          </div>
        </div>
      </div>

      {/* ===== MODAL STOCK OPNAME ===== */}
      {showOpname && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 print:hidden">
          <div className="bg-white rounded-2xl p-5 max-w-6xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
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

            <div className="mb-4 flex flex-wrap items-center gap-4 bg-gray-50 p-3 rounded-xl">
              <label className="text-sm font-bold text-gray-600">Tanggal Opname:</label>
              <input 
                type="date" 
                value={opnameDate} 
                onChange={(e) => setOpnameDate(e.target.value)}
                className="border rounded-lg px-3 py-1.5 text-sm"
              />
              <span className="text-xs text-gray-400 ml-4">
                Total: {opnameData.length} produk | 
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

      {/* ===== MODAL CETAK BARCODE ===== */}
      {showBarcodePrint && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 print:hidden">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-xl font-black text-gray-800 mb-2 text-center">Cetak Stiker Barcode</h3>
            <p className="text-xs text-gray-400 text-center mb-6 uppercase font-bold tracking-widest">Printer Thermal / Standar</p>
            
            <div id="barcode-sticker" className="border-2 border-dashed border-gray-200 p-6 rounded-2xl mb-6 flex flex-col items-center justify-center bg-gray-50">
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

      {/* ===== MODAL TAMBAH SUPPLIER ===== */}
      {showAddSupplier && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 print:hidden">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-black text-gray-800">🏢 Tambah Supplier</h3>
              <button onClick={() => setShowAddSupplier(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Nama Supplier *</label>
                <input 
                  type="text" 
                  value={newSupplierName} 
                  onChange={(e) => setNewSupplierName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="PT Agro Makmur"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Kontak Person</label>
                <input 
                  type="text" 
                  value={newSupplierContact} 
                  onChange={(e) => setNewSupplierContact(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Bapak Andi"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">No. Telepon</label>
                <input 
                  type="text" 
                  value={newSupplierPhone} 
                  onChange={(e) => setNewSupplierPhone(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="0812-3456-7890"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setShowAddSupplier(false)} className="flex-1 py-2.5 border border-gray-200 text-gray-500 font-bold rounded-lg hover:bg-gray-50 transition">Batal</button>
              <button onClick={handleAddSupplier} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-lg transition">Simpan Supplier</button>
            </div>
          </div>
        </div>
      )}
      {/* ===== MODAL TAMBAH SATUAN ===== */}
{showAddUnitModal && (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
    <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-black text-gray-800">📦 Tambah Satuan</h3>
        <button onClick={() => setShowAddUnitModal(false)} className="text-gray-400 hover:text-gray-600">
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-bold text-gray-500 mb-1">Nama Satuan *</label>
          <input 
            type="text" 
            value={newUnitName} 
            onChange={(e) => setNewUnitName(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="Contoh: Liter, Gram, Pcs"
          />
        </div>
      </div>
      <div className="flex gap-2 mt-5">
        <button onClick={() => setShowAddUnitModal(false)} className="flex-1 py-2.5 border border-gray-200 text-gray-500 font-bold rounded-lg hover:bg-gray-50 transition">Batal</button>
        <button onClick={handleAddUnit} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-lg transition">Simpan Satuan</button>
      </div>
    </div>
  </div>
)}

      {/* ===== AREA PRINT BARCODE ===== */}
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