"use client";

import React, { useState, useEffect } from 'react';
import { dbLocal, LocalProduct } from '@/lib/dbLocal';
import { 
  ShoppingCart, Search, Package, ShoppingBag, 
  CreditCard, Printer, Banknote, QrCode, Layers, 
  X, Plus, Minus, Trash2, CheckCircle2 
} from 'lucide-react';

interface CartItem extends LocalProduct {
  quantity: number;
}

export default function KasirPage() {
  const [products, setProducts] = useState<LocalProduct[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<LocalProduct[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showInvoice, setShowInvoice] = useState(false);
  const [currentInvoiceNo, setCurrentInvoiceNo] = useState('');

  // State Filter Kategori untuk Mempercepat Kerja Kasir (BRD Poin 6)
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // State Utama Fitur Metode Bayar & Kalkulator Kembalian (BRD Poin 5)
  const [paymentMethod, setPaymentMethod] = useState<'Tunai' | 'QRIS / Transfer'>('Tunai');
  const [cashReceived, setCashReceived] = useState<number | ''>('');
  const [cashReturn, setCashReturn] = useState<number>(0);

  // Merek Toko Dinamis dari Database
  const [shopName, setShopName] = useState('SISUKA POS');
  const [logoUrl, setLogoUrl] = useState('');

  // Hitung Total Harga secara otomatis
  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  useEffect(() => {
    loadProductsAndConfig();
  }, []);

  const loadProductsAndConfig = async () => {
    try {
      // Pastikan dbLocal sudah terdefinisi dan memiliki tabel yang sesuai
      const localData = await dbLocal.products.toArray();
      setProducts(localData);
      setFilteredProducts(localData);

      const savedConfig = await dbLocal.config.get('shop_settings');
      if (savedConfig) {
        setShopName(savedConfig.shopName || 'SISUKA POS');
        setLogoUrl(savedConfig.logoBase64 || '');
      }
    } catch (error) {
      console.error("Gagal memuat data dari IndexedDB:", error);
    }
  };

  // Logika Filter Pencarian Teks + Tombol Kategori Sekaligus
  useEffect(() => {
    let result = products.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (selectedCategory !== 'ALL') {
      result = result.filter(p => p.category === selectedCategory);
    }

    setFilteredProducts(result);
  }, [searchTerm, selectedCategory, products]);

  // Otomatisasi Perhitungan Rumus Matematika Kembalian Kasir
  useEffect(() => {
    if (paymentMethod === 'QRIS / Transfer') {
      setCashReturn(0);
    } else {
      const bayar = cashReceived === '' ? 0 : Number(cashReceived);
      const sisa = bayar - totalPrice;
      setCashReturn(sisa > 0 ? sisa : 0);
    }
  }, [cashReceived, totalPrice, paymentMethod]);

  const addToCart = (product: LocalProduct) => {
    if (product.stock <= 0) return alert('Maaf, pasokan stok barang habis di gudang!');
    
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          alert('Input penjualan melebihi batas jumlah stok fisik gudang aktif!');
          return prevCart;
        }
        return prevCart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string | number, delta: number) => {
    setCart(prevCart => prevCart.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        if (newQty > item.stock) {
          alert('Stok tidak mencukupi!');
          return item;
        }
        return newQty > 0 ? { ...item, quantity: newQty } : item;
      }
      return item;
    }));
  };

  const removeFromCart = (id: string | number) => {
    setCart(prevCart => prevCart.filter(item => item.id !== id));
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return alert('Keranjang masih kosong!');
    
    if (paymentMethod === 'Tunai') {
      if (cashReceived === '' || Number(cashReceived) < totalPrice) {
        return alert('Uang tunai yang diterima kurang dari total nilai tagihan!');
      }
    }

    const invoiceNo = `INV-${Date.now().toString().slice(-6)}`;
    
    try {
      // Simpan riwayat transaksi kasir ke dalam database lokal (BRD Poin 5)
      await dbLocal.sales.add({
        id: invoiceNo,
        timestamp: Date.now(),
        totalPrice: totalPrice,
        paymentMethod: paymentMethod,
        cashReceived: paymentMethod === 'Tunai' ? Number(cashReceived) : totalPrice,
        cashReturn: cashReturn,
        items: cart.map(item => ({
          productId: item.id,
          name: item.name,
          quantity: item.quantity,
          purchasePrice: item.purchasePrice || 0, // Modal untuk laporan laba (BRD Poin 14)
          price: item.price,
          units: item.units
        }))
      });

      // Potong stok gudang secara otomatis (BRD Poin 6)
      for (const item of cart) {
        const productInDb = await dbLocal.products.get(item.id);
        if (productInDb) {
          await dbLocal.products.update(item.id, {
            stock: productInDb.stock - item.quantity
          });
        }
      }

      setCurrentInvoiceNo(invoiceNo);
      setShowInvoice(true);
      // Jangan langsung loadProductsAndConfig di sini agar modal invoice tetap muncul dengan data yang benar
    } catch (err) {
      console.error(err);
      alert('Gagal mengunci transaksi offline kasir!');
    }
  };

  const finishTransaction = () => {
    setCart([]);
    setCashReceived('');
    setShowInvoice(false);
    loadProductsAndConfig(); // Refresh stok setelah transaksi selesai
  };

  const handlePrint = () => {
    window.print();
    // Setelah print biasanya user ingin menutup invoice
  };

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 font-sans print:bg-white print:text-black overflow-hidden">
      
      {/* SISI KIRI: KATALOG ETALASE PRODUK */}
      <div className="flex-1 flex flex-col p-6 overflow-hidden print:hidden">
        
        {/* Header & Search */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-6">
          <div>
            <h1 className="text-2xl font-black text-emerald-800">{shopName}</h1>
            <p className="text-xs text-gray-500">Sistem Kasir & ERP UMKM</p>
          </div>
          
          <div className="relative w-full sm:w-96">
            <input
              type="text"
              placeholder="Cari nama barang atau SKU produk..."
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-3 top-3.5 text-gray-400 w-5 h-5" />
          </div>
        </div>

        {/* Filter Kategori (BRD Poin 6) */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 no-scrollbar">
          {['ALL', 'Pupuk', 'Insektisida', 'Fungisida', 'Herbisida', 'Alat Pertanian'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                selectedCategory === cat 
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-md' 
                : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grid Katalog Item */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-4">
          {filteredProducts.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center text-gray-400 h-64 bg-white rounded-3xl border-2 border-dashed border-gray-200">
              <Package className="w-16 h-16 mb-4 stroke-1 opacity-20" />
              <p className="text-sm font-medium">Produk tidak ditemukan</p>
            </div>
          ) : (
            filteredProducts.map((product) => (
              <div 
                key={product.id} 
                onClick={() => addToCart(product)}
                className="group bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-emerald-500 cursor-pointer transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-[10px] bg-gray-50 text-gray-500 px-2 py-1 rounded-lg font-mono font-bold border border-gray-100">
                      {product.sku || 'NO-SKU'}
                    </span>
                    <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-1 rounded-lg font-bold uppercase">
                      {product.category}
                    </span>
                  </div>
                  <h3 className="font-bold text-gray-800 text-sm line-clamp-2 group-hover:text-emerald-700 transition-colors">
                    {product.name}
                  </h3>
                </div>
                <div className="mt-4 flex justify-between items-end border-t pt-3 border-gray-50">
                  <div>
                    <p className={`text-[10px] font-bold mb-1 ${product.stock <= 5 ? 'text-red-500' : 'text-gray-400'}`}>
                      Stok: {product.stock} {product.units}
                    </p>
                    <p className="text-lg font-black text-emerald-600">
                      {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(product.price)}
                    </p>
                  </div>
                  <div className="bg-emerald-50 text-emerald-700 p-2 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-all">
                    <Plus className="w-4 h-4" />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* SISI KANAN: RINGKASAN STRUK KERANJANG BELANJA */}
      <div className="w-[400px] bg-white border-l border-gray-200 flex flex-col shadow-2xl print:hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-emerald-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-600 rounded-xl">
              <ShoppingCart className="text-white w-5 h-5" />
            </div>
            <div>
              <h2 className="font-black text-emerald-900 text-lg">Checkout</h2>
              <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Antrian Aktif</p>
            </div>
          </div>
          <span className="bg-emerald-100 text-emerald-700 text-xs font-black px-3 py-1 rounded-full border border-emerald-200">
            {cart.length} Item
          </span>
        </div>

        {/* Item di Keranjang */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/30">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 px-10 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <ShoppingBag className="w-10 h-10 stroke-1 text-gray-300" />
              </div>
              <p className="text-sm font-bold text-gray-500">Keranjang Kosong</p>
              <p className="text-xs text-gray-400 mt-1">Silakan pilih produk di etalase untuk memulai transaksi</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="group bg-white p-3 rounded-2xl border border-gray-100 shadow-sm hover:border-emerald-200 transition-all">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1 pr-2">
                    <h4 className="font-bold text-xs text-gray-800 line-clamp-1">{item.name}</h4>
                    <p className="text-[10px] text-gray-400 font-medium">
                      {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(item.price)} / {item.units}
                    </p>
                  </div>
                  <button 
                    onClick={() => removeFromCart(item.id)}
                    className="text-gray-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="flex justify-between items-center mt-3">
                  <div className="flex items-center bg-gray-100 rounded-lg p-1">
                    <button 
                      onClick={() => updateQuantity(item.id, -1)}
                      className="p-1 hover:bg-white rounded-md transition-all text-gray-500"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="px-3 text-xs font-black text-gray-700">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.id, 1)}
                      className="p-1 hover:bg-white rounded-md transition-all text-gray-500"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <p className="text-sm font-black text-gray-800">
                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(item.price * item.quantity)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Ringkasan Pembayaran */}
        <div className="p-6 bg-white border-t border-gray-100 shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
          <div className="space-y-4 mb-6">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500 font-medium">Subtotal</span>
              <span className="text-sm font-bold text-gray-800">
                {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(totalPrice)}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => setPaymentMethod('Tunai')}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 transition-all font-bold text-xs ${
                  paymentMethod === 'Tunai' 
                  ? 'bg-emerald-50 border-emerald-600 text-emerald-700' 
                  : 'bg-white border-gray-100 text-gray-400'
                }`}
              >
                <Banknote className="w-4 h-4" /> Tunai
              </button>
              <button 
                onClick={() => setPaymentMethod('QRIS / Transfer')}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 transition-all font-bold text-xs ${
                  paymentMethod === 'QRIS / Transfer' 
                  ? 'bg-emerald-50 border-emerald-600 text-emerald-700' 
                  : 'bg-white border-gray-100 text-gray-400'
                }`}
              >
                <QrCode className="w-4 h-4" /> QRIS
              </button>
            </div>

            {paymentMethod === 'Tunai' && (
              <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-bold text-gray-400">Rp</span>
                  <input
                    type="number"
                    placeholder="Uang diterima..."
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-black text-sm"
                    value={cashReceived}
                    onChange={(e) => setCashReceived(e.target.value === '' ? '' : Number(e.target.value))}
                  />
                </div>
                <div className="flex justify-between items-center px-1">
                  <span className="text-xs text-gray-500 font-medium">Kembalian</span>
                  <span className={`text-sm font-black ${cashReturn > 0 ? 'text-orange-600' : 'text-gray-400'}`}>
                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(cashReturn)}
                  </span>
                </div>
              </div>
            )}
          </div>

          <button 
            onClick={handleCheckout}
            disabled={cart.length === 0}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-200 text-white py-4 rounded-2xl font-black text-lg shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-3"
          >
            <CreditCard className="w-6 h-6" /> BAYAR SEKARANG
          </button>
        </div>
      </div>

      {/* MODAL INVOICE (BRD Poin 5 & 16) */}
      {showInvoice && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-8 text-center border-b border-dashed border-gray-200">
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <h2 className="text-2xl font-black text-gray-800">Transaksi Berhasil!</h2>
              <p className="text-sm text-gray-500 mt-1">Nomor Invoice: <span className="font-mono font-bold text-emerald-600">{currentInvoiceNo}</span></p>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 font-medium">Metode Pembayaran</span>
                <span className="font-bold text-gray-800">{paymentMethod}</span>
              </div>
              <div className="flex justify-between items-center text-xl">
                <span className="text-gray-500 font-medium">Total Bayar</span>
                <span className="font-black text-emerald-600">
                  {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(totalPrice)}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-4">
                <button 
                  onClick={handlePrint}
                  className="flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-gray-200 font-bold text-gray-600 hover:bg-gray-50 transition-all"
                >
                  <Printer className="w-5 h-5" /> Cetak Struk
                </button>
                <button 
                  onClick={finishTransaction}
                  className="bg-gray-900 text-white py-3.5 rounded-2xl font-bold hover:bg-black transition-all"
                >
                  Transaksi Baru
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CSS KHUSUS PRINT */}
      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          .modal-invoice, .modal-invoice * { visibility: visible; }
          .modal-invoice { position: absolute; left: 0; top: 0; width: 100%; }
          .no-scrollbar::-webkit-scrollbar { display: none; }
        }
      `}</style>
    </div>
  );
}