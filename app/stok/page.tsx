"use client";

import React, { useState, useEffect } from 'react';
import { dbLocal, LocalProduct } from '@/lib/dbLocal';
import { Package, Plus, Trash2, ArrowUp, FileSpreadsheet, Download, AlertCircle, TrendingUp } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function StokGudangPage() {
  const [products, setProducts] = useState<LocalProduct[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<LocalProduct[]>([]);
  
  // State Form Input Manual
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState<'Pupuk' | 'Insektisida' | 'Fungisida' | 'Herbisida' | 'Alat Pertanian'>('Pupuk');
  const [units, setUnits] = useState('Sak');
  const [stock, setStock] = useState<number | ''>(0);
  const [purchasePrice, setPurchasePrice] = useState<number | ''>(0); 
  const [sellingPrice, setSellingPrice] = useState<number | ''>(0); 
  const [isSeasonal, setIsSeasonal] = useState(false);

  // State Filter Tabel Atas
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL');

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
      setFilteredProducts(products.filter(p => p.category === selectedFilter));
    }
  }, [selectedFilter, products]);

  // FUNGSI: GENERATE DAN UNDUH BLANKO EXCEL BERISI 100 MASTER DATA PRODUK TERLARIS DI INDONESIA
  const downloadTemplateExcel = () => {
    const masterDataIndonesia = [
      // === KATEGORI: PUPUK ===
      { "SKU": "PPK-001", "Nama Barang": "Pupuk Urea Nitrea Pusri Non-Subsidi 50kg", "Kategori": "Pupuk", "Satuan": "Sak", "Stok": 100, "Harga Beli": 140000, "Harga Jual": 165000 },
      { "SKU": "PPK-002", "Nama Barang": "Pupuk NPK Mutiara 16-16-16 YARA 1kg", "Kategori": "Pupuk", "Satuan": "Pack", "Stok": 50, "Harga Beli": 15000, "Harga Jual": 18000 },
      { "SKU": "PPK-003", "Nama Barang": "Pupuk NPK Phonska Plus Swasta 25kg", "Kategori": "Pupuk", "Satuan": "Sak", "Stok": 40, "Harga Beli": 175000, "Harga Jual": 195000 },
      { "SKU": "PPK-004", "Nama Barang": "Pupuk SP-36 Petrokimia 50kg", "Kategori": "Pupuk", "Satuan": "Sak", "Stok": 30, "Harga Beli": 155000, "Harga Jual": 175000 },
      { "SKU": "PPK-005", "Nama Barang": "Pupuk KCI Mahkota 50kg", "Kategori": "Pupuk", "Satuan": "Sak", "Stok": 25, "Harga Beli": 380000, "Harga Jual": 410000 },
      
      // === KATEGORI: INSEKTISIDA ===
      { "SKU": "INS-041", "Nama Barang": "Insektisida Regen 50SC 100ml", "Kategori": "Insektisida", "Satuan": "Botol", "Stok": 40, "Harga Beli": 38000, "Harga Jual": 45000 },
      { "SKU": "INS-042", "Nama Barang": "Insektisida Virtako 300SC 50ml", "Kategori": "Insektisida", "Satuan": "Botol", "Stok": 50, "Harga Beli": 122000, "Harga Jual": 135000 },
      { "SKU": "INS-043", "Nama Barang": "Insektisida Curacron 500EC 100ml", "Kategori": "Insektisida", "Satuan": "Botol", "Stok": 45, "Harga Beli": 36000, "Harga Jual": 42000 },
      { "SKU": "INS-044", "Nama Barang": "Insektisida Decis 25EC 100ml", "Kategori": "Insektisida", "Satuan": "Botol", "Stok": 60, "Harga Beli": 25000, "Harga Jual": 30000 },
      { "SKU": "INS-045", "Nama Barang": "Insektisida Alika 247ZC 100ml", "Kategori": "Insektisida", "Satuan": "Botol", "Stok": 40, "Harga Beli": 52000, "Harga Jual": 60000 },

      // === KATEGORI: FUNGISIDA ===
      { "SKU": "FNG-061", "Nama Barang": "Fungisida Antracol 70WP Bayer 500g", "Kategori": "Fungisida", "Satuan": "Pack", "Stok": 100, "Harga Beli": 62000, "Harga Jual": 72000 },
      { "SKU": "FNG-062", "Nama Barang": "Fungisida Amistartop 325SC Syngenta 100ml", "Kategori": "Fungisida", "Satuan": "Botol", "Stok": 40, "Harga Beli": 135000, "Harga Jual": 150000 },
      { "SKU": "FNG-063", "Nama Barang": "Fungisida Dithane M-45 80WP Dow 500g", "Kategori": "Fungisida", "Satuan": "Pack", "Stok": 60, "Harga Beli": 55000, "Harga Jual": 65000 },
      { "SKU": "FNG-064", "Nama Barang": "Fungisida Score 250EC Syngenta 100ml", "Kategori": "Fungisida", "Satuan": "Botol", "Stok": 45, "Harga Beli": 58000, "Harga Jual": 68000 },
      { "SKU": "FNG-065", "Nama Barang": "Fungisida Nativo 75WG Bayer 50g", "Kategori": "Fungisida", "Satuan": "Pack", "Stok": 80, "Harga Beli": 46000, "Harga Jual": 53000 },

      // === KATEGORI: HERBISIDA ===
      { "SKU": "HER-021", "Nama Barang": "Herbisida Gramoxone 276SL 1L", "Kategori": "Herbisida", "Satuan": "Botol", "Stok": 50, "Harga Beli": 75000, "Harga Jual": 85000 },
      { "SKU": "HER-022", "Nama Barang": "Herbisida RoundUp 486SL 1L", "Kategori": "Herbisida", "Satuan": "Botol", "Stok": 50, "Harga Beli": 95000, "Harga Jual": 110000 },
      { "SKU": "HER-023", "Nama Barang": "Herbisida Calaris 550SC 500ml", "Kategori": "Herbisida", "Satuan": "Botol", "Stok": 30, "Harga Beli": 115000, "Harga Jual": 130000 },
      { "SKU": "HER-024", "Nama Barang": "Herbisida Elang 480SL 1L", "Kategori": "Herbisida", "Satuan": "Botol", "Stok": 40, "Harga Beli": 70000, "Harga Jual": 82000 },
      { "SKU": "HER-025", "Nama Barang": "Herbisida Lindomin 865SL 400ml", "Kategori": "Herbisida", "Satuan": "Botol", "Stok": 35, "Harga Beli": 38000, "Harga Jual": 45000 },

      // === KATEGORI: ALAT PERTANIAN ===
      { "SKU": "ALT-081", "Nama Barang": "Cangkul Baja Chillington Buaya", "Kategori": "Alat Pertanian", "Satuan": "Pack", "Stok": 20, "Harga Beli": 75000, "Harga Jual": 90000 },
      { "SKU": "ALT-082", "Nama Barang": "Tangki Semprot Manual Solo 16L", "Kategori": "Alat Pertanian", "Satuan": "Pack", "Stok": 15, "Harga Beli": 340000, "Harga Jual": 385000 },
      { "SKU": "ALT-083", "Nama Barang": "Tangki Semprot Elektrik CBA 16L", "Kategori": "Alat Pertanian", "Satuan": "Pack", "Stok": 25, "Harga Beli": 510000, "Harga Jual": 565000 },
      { "SKU": "ALT-084", "Nama Barang": "Sabit Rumput Baja Isen Tajam", "Kategori": "Alat Pertanian", "Satuan": "Pack", "Stok": 40, "Harga Beli": 35000, "Harga Jual": 45000 },
      { "SKU": "ALT-085", "Nama Barang": "Terpal Penjemuran Padi A5 6x8M", "Kategori": "Alat Pertanian", "Satuan": "Pack", "Stok": 20, "Harga Beli": 210000, "Harga Jual": 245000 }
    ];

    const worksheet = XLSX.utils.json_to_sheet(masterDataIndonesia);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template_Stok_Profit");

    worksheet['!cols'] = [
      { wch: 15 }, { wch: 40 }, { wch: 15 }, { wch: 10 }, { wch: 10 }, { wch: 15 }, { wch: 15 }
    ];

    XLSX.writeFile(workbook, "Blanko_Excel_Stok_Profit_SISUKA.xlsx");
  };

  // FUNGSI: MEMBACA DAN MEMASUKKAN MASSAL DATA DARI FILE EXCEL (MENGUNCI KE PURCHASEPRICE)
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
          const skuCode = row["SKU"] || `PRD-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 100)}`;
          const productName = row["Nama Barang"];
          let kat = row["Kategori"] || "Pupuk";
          
          if (!productName) continue;

          if (kat.toLowerCase().includes('insek')) kat = 'Insektisida';
          else if (kat.toLowerCase().includes('fungi')) kat = 'Fungisida';
          else if (kat.toLowerCase().includes('herbi')) kat = 'Herbisida';
          else if (kat.toLowerCase().includes('alat') || kat.toLowerCase().includes('perkakas')) kat = 'Alat Pertanian';
          else kat = 'Pupuk';

          produkSiapSimpan.push({
            id: `XL-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            sku: skuCode.toString().trim(),
            name: productName.toString().trim(),
            category: kat,
            units: (row["Satuan"] || "Sak").toString(),
            stock: Number(row["Stok"]) || 0,
            purchasePrice: Number(row["Harga Beli"]) || 0, 
            price: Number(row["Harga Jual"]) || 0, 
            is_seasonal: false
          });
        }

        await dbLocal.products.bulkAdd(produkSiapSimpan);
        alert(`Sukses! ${produkSiapSimpan.length} produk berhasil diimpor.`);
        loadProducts();
      } catch (err) {
        console.error(err);
        alert('Gagal membaca file Excel. Pastikan kolom: SKU, Nama Barang, Kategori, Satuan, Stok, Harga Beli, Harga Jual');
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
        is_seasonal: isSeasonal, 
        category: category 
      } as any);
      setName(''); setSku(''); setStock(0); setPurchasePrice(0); setSellingPrice(0); setIsSeasonal(false);
      loadProducts();
      alert('Produk berhasil disimpan!');
    } catch (error) { console.error(error); }
  };

  const handleRefillStock = async (id: string) => {
    const product = await dbLocal.products.get(id);
    if (!product) return;
