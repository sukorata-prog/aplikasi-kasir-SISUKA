"use client";

import React, { useState, useEffect } from 'react';
import { dbLocal, LocalProduct, DynamicCategory, User } from '@/lib/dbLocal';
import { 
  ShoppingCart, 
  Search, 
  Package, 
  ShoppingBag, 
  Printer, 
  Banknote, 
  QrCode, 
  Plus, 
  Minus, 
  Trash2, 
  Check,
  Landmark,
  LogOut,
  UserIcon
} from 'lucide-react';
import Link from 'next/link';

interface CartItem extends LocalProduct {
  quantity: number;
}

// ===== KOMPONEN LOGIN KASIR =====
const LoginKasir = ({ onLogin }: { onLogin: (user: User) => void }) => {
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [pinInput, setPinInput] = useState('');
  const [error, setError] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const data = await dbLocal.users
          .where('role')
          .equals('KASIR')
          .and(u => u.isActive === true)
          .toArray();
        setUsers(data);
      } catch (err) {
        console.error('Gagal load users:', err);
      } finally {
        setLoading(false);
      }
    };
    loadUsers();
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = users.find(u => u.id === selectedUser);
    if (!user) {
      setError('Pilih kasir terlebih dahulu!');
      return;
    }
    if (pinInput === user.pin) {
      setError('');
      onLogin(user);
    } else {
      setError('PIN salah!');
      setPinInput('');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full border border-gray-200">
        <div className="text-center mb-6">
          <div className="bg-emerald-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <UserIcon className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-black text-gray-800">Login Kasir</h2>
          <p className="text-sm text-gray-400">Pilih nama dan masukkan PIN</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nama Kasir</label>
            <select
              value={selectedUser}
              onChange={(e) => {
                setSelectedUser(e.target.value);
                setError('');
                setPinInput('');
              }}
              className="w-full border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
              required
            >
              <option value="">Pilih Kasir</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} - Shift {user.shift}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">PIN</label>
            <input
              type="password"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="••••"
              className="w-full border rounded-xl px-4 py-3 text-center text-2xl font-bold tracking-widest outline-none focus:ring-2 focus:ring-emerald-500"
              maxLength={4}
              required
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm font-bold text-center">{error}</p>
          )}

          <button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition"
          >
            Login
          </button>
        </form>

        <p className="text-center text-[10px] text-gray-400 mt-4">
          Hubungi owner jika lupa PIN
        </p>
      </div>
    </div>
  );
};

export default function KasirPage() {
  // ===== STATE =====
  const [products, setProducts] = useState<LocalProduct[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<LocalProduct[]>([]);
  const [categories, setCategories] = useState<DynamicCategory[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showInvoice, setShowInvoice] = useState(false);
  const [currentInvoiceNo, setCurrentInvoiceNo] = useState('');
  const [activeTab, setActiveTab] = useState<'kasir' | 'laporan'>('kasir');
  
  // ===== STATE LOGIN KASIR =====
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // ===== SEED DATA KASIR =====
  useEffect(() => {
    const seedKasir = async () => {
      try {
        const existing = await dbLocal.users.toArray();
        if (existing.length === 0) {
          await dbLocal.users.bulkAdd([
            {
              id: 'KSR-001',
              name: 'Budi',
              role: 'KASIR',
              shift: 'Pagi',
              pin: '1111',
              isActive: true,
              createdAt: Date.now()
            },
            {
              id: 'KSR-002',
              name: 'Ani',
              role: 'KASIR',
              shift: 'Siang',
              pin: '2222',
              isActive: true,
              createdAt: Date.now()
            },
            {
              id: 'KSR-003',
              name: 'Cindy',
              role: 'KASIR',
              shift: 'Malam',
              pin: '3333',
              isActive: true,
              createdAt: Date.now()
            },
            {
              id: 'OWN-001',
              name: 'Owner',
              role: 'OWNER',
              shift: null,
              pin: '1234',
              isActive: true,
              createdAt: Date.now()
            }
          ]);
          console.log('✅ Data kasir default berhasil dibuat!');
        }
      } catch (err) {
        console.error('Gagal seed kasir:', err);
      }
    };
    seedKasir();
  }, []);

  // ===== STATE KATEGORI & PEMBAYARAN =====
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [paymentMethod, setPaymentMethod] = useState<'Tunai' | 'QRIS / Transfer'>('Tunai');
  const [cashReceived, setCashReceived] = useState<number | ''>('');
  const [cashReturn, setCashReturn] = useState<number>(0);

  // ===== STATE KONFIGURASI TOKO =====
  const [shopName, setShopName] = useState('SISUKA ERP');
  const [logoUrl, setLogoUrl] = useState('');

  // ===== STATE LAST TRANSACTION =====
  const [lastTransaction, setLastTransaction] = useState<{
    total: number;
    method: string;
  } | null>(null);

  // ===== TOTAL HARGA =====
  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // ===== EFFECT =====
  useEffect(() => {
    loadProductsAndConfig();
  }, []);

  // ===== LOAD DATA =====
  const loadProductsAndConfig = async () => {
    try {
      const localData = await dbLocal.products.toArray();
      const catData = await dbLocal.categories.toArray();
      setProducts(localData);
      setFilteredProducts(localData);
      setCategories(catData);

      const savedConfig = await dbLocal.config.get('shop_settings');
      if (savedConfig) {
        setShopName(savedConfig.shopName || 'SISUKA ERP');
        setLogoUrl(savedConfig.logoBase64 || '');
      }
    } catch (err) {
      console.error("Gagal memuat data kasir:", err);
    }
  };

  // ===== FILTER PENCARIAN + KATEGORI =====
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

  // ===== KALKULATOR KEMBALIAN =====
  useEffect(() => {
    if (paymentMethod === 'QRIS / Transfer') {
      setCashReturn(0);
    } else {
      const bayar = cashReceived === '' ? 0 : Number(cashReceived);
      const sisa = bayar - totalPrice;
      setCashReturn(sisa > 0 ? sisa : 0);
    }
  }, [cashReceived, totalPrice, paymentMethod]);

  // ===== FUNGSI KERANJANG =====
  const addToCart = (product: LocalProduct) => {
    if (product.stock <= 0) return alert('Maaf, pasokan stok barang habis!');
    
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          alert('Input melebihi batas jumlah stok fisik gudang aktif!');
          return prevCart;
        }
        return prevCart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newQty = item.quantity + delta;
          if (newQty > 0 && newQty <= item.stock) {
            return { ...item, quantity: newQty };
          }
        }
        return item;
      })
    );
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const clearCart = () => {
    if (cart.length > 0 && confirm("Yakin ingin mengosongkan keranjang?")) {
      setCart([]);
      setCashReceived('');
    }
  };

  // ===== FUNGSI PRINT STRUK THERMAL =====
  const printThermalReceipt = (invoiceNo: string) => {
    if (cart.length === 0) {
      alert('Keranjang kosong!');
      return;
    }

    const itemsHTML = cart.map(item => `
      <tr>
        <td style="text-align:left; padding:2px 0;">${item.name}</td>
        <td style="text-align:center; padding:2px 0;">${item.quantity}</td>
        <td style="text-align:right; padding:2px 0;">Rp ${(item.price * item.quantity).toLocaleString('id-ID')}</td>
      </tr>
    `).join('');

    const printContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Struk Belanja</title>
      <style>
        @page { 
          size: 80mm auto; 
          margin: 5px; 
        }
        body { 
          font-family: 'Courier New', monospace;
          font-size: 12px;
          padding: 5px;
          width: 80mm;
          margin: 0 auto;
          background: white;
        }
        .receipt {
          width: 100%;
        }
        .header {
          text-align: center;
          font-weight: bold;
          font-size: 16px;
          border-bottom: 1px dashed #000;
          padding-bottom: 8px;
          margin-bottom: 8px;
        }
        .header .shop-name {
          font-size: 18px;
        }
        .header .sub {
          font-size: 11px;
          font-weight: normal;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 5px 0;
        }
        th {
          border-bottom: 1px dashed #000;
          padding: 4px 0;
          font-size: 11px;
          text-align: left;
        }
        td {
          padding: 2px 0;
          font-size: 11px;
        }
        .total {
          border-top: 1px dashed #000;
          padding-top: 8px;
          font-weight: bold;
          font-size: 14px;
          text-align: right;
        }
        .payment-info {
          border-top: 1px dashed #000;
          padding-top: 8px;
          margin-top: 8px;
          font-size: 11px;
        }
        .footer {
          text-align: center;
          border-top: 1px dashed #000;
          padding-top: 8px;
          margin-top: 8px;
          font-size: 10px;
        }
        .divider {
          border-top: 1px dashed #000;
          margin: 4px 0;
        }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .text-left { text-align: left; }
        .bold { font-weight: bold; }
        @media print {
          body { margin: 0; padding: 5px; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="receipt" id="receipt">
        <div class="header">
          <div class="shop-name">${shopName || 'SISUKA ERP'}</div>
          <div class="sub">${shopName ? 'STRUK BELANJA' : 'SISTEM KASIR'}</div>
          <div class="sub">No: ${invoiceNo}</div>
          <div class="sub">${new Date().toLocaleString('id-ID')}</div>
          <div class="sub">Kasir: ${currentUser?.name || 'Unknown'}</div>
        </div>

        <table>
          <thead>
            <tr>
              <th class="text-left">Item</th>
              <th class="text-center">Qty</th>
              <th class="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHTML}
          </tbody>
        </table>

        <div class="divider"></div>

        <div class="total">
          TOTAL: Rp ${totalPrice.toLocaleString('id-ID')}
        </div>

        <div class="payment-info">
          <div>Metode: ${paymentMethod}</div>
          ${paymentMethod === 'Tunai' ? `
            <div>Bayar: Rp ${Number(cashReceived).toLocaleString('id-ID')}</div>
            <div>Kembali: Rp ${cashReturn.toLocaleString('id-ID')}</div>
          ` : ''}
        </div>

        <div class="footer">
          <div>Terima kasih atas kunjungan Anda!</div>
          <div style="font-size:9px; margin-top:4px;">${shopName || 'SISUKA ERP'} - Sistem Kasir</div>
        </div>
      </div>
      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 500);
        }
      </script>
    </body>
    </html>
    `;

    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
    } else {
      alert('Mohon izinkan popup untuk mencetak struk!');
    }
  };

  // ===== CHECKOUT =====
  const handleCheckout = async () => {
    if (cart.length === 0) {
      return alert('Keranjang belanja masih kosong!');
    }

    if (paymentMethod === 'Tunai') {
      if (cashReceived === '' || Number(cashReceived) < totalPrice) {
        return alert('Uang tunai yang diterima kurang dari total nilai tagihan!');
      }
    }

    const invoiceNo = `INV-${Date.now().toString().slice(-6)}`;
    
    const finalTotalPrice = totalPrice;
    const finalPaymentMethod = paymentMethod;
    const finalCashReceived = cashReceived;
    const finalCashReturn = cashReturn;
    const finalCart = [...cart];
    
    try {
      await dbLocal.sales.add({
        id: invoiceNo,
        timestamp: Date.now(),
        totalPrice: finalTotalPrice,
        paymentMethod: finalPaymentMethod,
        kasirId: currentUser?.id || '',
        kasirName: currentUser?.name || '',
        shift: currentUser?.shift || 'Pagi',
        items: cart.map(item => ({
          productId: item.id,
          name: item.name,
          quantity: item.quantity,
          purchasePrice: item.purchasePrice || 0,
          price: item.price,
          units: item.units
        }))
      });

      for (const item of cart) {
        const productInDb = await dbLocal.products.get(item.id);
        if (productInDb) {
          await dbLocal.products.update(item.id, {
            stock: productInDb.stock - item.quantity
          });
        }
      }

      setLastTransaction({
        total: finalTotalPrice,
        method: finalPaymentMethod
      });
      
      setCurrentInvoiceNo(invoiceNo);
      setShowInvoice(true);
      printThermalReceipt(invoiceNo);
      
      setCart([]);
      setCashReceived('');
      loadProductsAndConfig(); 
      
    } catch (err) {
      console.error(err);
      alert('Gagal mengunci transaksi offline kasir!');
    }
  };

// ===== KOMPONEN LAPORAN KASIR =====
const LaporanKasir = () => {
  const [shift, setShift] = useState<'Pagi' | 'Siang' | 'Malam' | 'SEMUA'>('SEMUA');
  const [laporan, setLaporan] = useState<any>(null);
  const [uangFisik, setUangFisik] = useState<number | ''>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLaporan = async () => {
      setLoading(true);
      try {
        const today = new Date();
        const startOfDay = new Date(today.setHours(0, 0, 0, 0)).getTime();
        const endOfDay = new Date(today.setHours(23, 59, 59, 999)).getTime();
        
        let query = await dbLocal.sales
          .where('timestamp')
          .between(startOfDay, endOfDay)
          .toArray();

        if (shift !== 'SEMUA') {
          query = query.filter(s => s.shift === shift);
        }

        const totalTransaksi = query.length;
        const totalOmzet = query.reduce((sum, s) => sum + s.totalPrice, 0);
        const totalTunai = query
          .filter(s => s.paymentMethod === 'Tunai')
          .reduce((sum, s) => sum + s.totalPrice, 0);
        const totalQRIS = query
          .filter(s => s.paymentMethod === 'QRIS / Transfer')
          .reduce((sum, s) => sum + s.totalPrice, 0);

        setLaporan({
          totalTransaksi,
          totalOmzet,
          totalTunai,
          totalQRIS,
          data: query
        });
      } catch (err) {
        console.error('Gagal load laporan:', err);
      } finally {
        setLoading(false);
      }
    };
    loadLaporan();
  }, [shift]);

  if (loading) {
    return <div className="text-center py-8 text-gray-400">Loading laporan...</div>;
  }

  if (!laporan) {
    return <div className="text-center py-8 text-gray-400">Belum ada data</div>;
  }

  const selisih = uangFisik ? Number(uangFisik) - laporan.totalTunai : 0;

  // ===== CETAK LAPORAN =====
  const handlePrint = () => {
    const printContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Laporan Kasir</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        .print-content { max-width: 800px; margin: 0 auto; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f3f4f6; }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .text-xs { font-size: 12px; }
        .text-sm { font-size: 14px; }
        .text-xl { font-size: 20px; }
        .text-2xl { font-size: 24px; }
        .font-bold { font-weight: bold; }
        .border-b { border-bottom: 1px solid #000; }
        .border-t { border-top: 1px solid #000; }
        .pt-4 { padding-top: 16px; }
        .pb-4 { padding-bottom: 16px; }
        .mb-4 { margin-bottom: 16px; }
        .mt-4 { margin-top: 16px; }
        .grid { display: grid; }
        .grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
        .grid-cols-4 { grid-template-columns: repeat(4, 1fr); }
        .gap-4 { gap: 16px; }
        .bg-gray-100 { background-color: #f3f4f6; }
        .text-emerald-600 { color: #059669; }
        .text-emerald-500 { color: #10b981; }
        .text-red-500 { color: #ef4444; }
        .text-gray-400 { color: #9ca3af; }
        .text-gray-500 { color: #6b7280; }
        .text-gray-600 { color: #4b5563; }
        .text-gray-700 { color: #374151; }
        @media print {
          body { padding: 10px; }
        }
      </style>
    </head>
    <body>
      <div class="print-content">
        <div class="text-center border-b pb-4 mb-4">
          <h2 class="text-2xl font-bold">${shopName || 'SISUKA ERP'}</h2>
          <p class="text-sm text-gray-500">LAPORAN KASIR</p>
          <p class="text-sm text-gray-500">
            ${shift === 'SEMUA' ? 'SEMUA SHIFT' : `SHIFT ${shift.toUpperCase()}`}
          </p>
          <p class="text-sm text-gray-500">
            ${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
          <p class="text-sm text-gray-500">Kasir: ${currentUser?.name || '-'}</p>
        </div>

        <div class="grid grid-cols-4 gap-4 mb-4">
          <div class="text-center">
            <p class="text-xs text-gray-500">Transaksi</p>
            <p class="text-xl font-bold">${laporan.totalTransaksi}</p>
          </div>
          <div class="text-center">
            <p class="text-xs text-gray-500">Omzet</p>
            <p class="text-xl font-bold">${formatRupiah(laporan.totalOmzet)}</p>
          </div>
          <div class="text-center">
            <p class="text-xs text-gray-500">Tunai</p>
            <p class="text-xl font-bold">${formatRupiah(laporan.totalTunai)}</p>
          </div>
          <div class="text-center">
            <p class="text-xs text-gray-500">QRIS/Transfer</p>
            <p class="text-xl font-bold">${formatRupiah(laporan.totalQRIS)}</p>
          </div>
        </div>

        ${uangFisik ? `
        <div class="border-t pt-4 mb-4">
          <div class="grid grid-cols-3 gap-4 text-center">
            <div>
              <p class="text-xs text-gray-500">Uang di Laci</p>
              <p class="text-lg font-bold">${formatRupiah(Number(uangFisik))}</p>
            </div>
            <div>
              <p class="text-xs text-gray-500">Selisih</p>
              <p class="text-lg font-bold ${selisih === 0 ? 'text-emerald-600' : selisih > 0 ? 'text-emerald-500' : 'text-red-500'}">
                ${formatRupiah(selisih)}
              </p>
            </div>
            <div>
              <p class="text-xs text-gray-500">Status</p>
              <p class="text-lg font-bold ${selisih === 0 ? 'text-emerald-600' : selisih > 0 ? 'text-emerald-500' : 'text-red-500'}">
                ${selisih === 0 ? '✅ PAS' : selisih > 0 ? '✅ LEBIH' : '❌ KURANG'}
              </p>
            </div>
          </div>
        </div>
        ` : ''}

        <div class="border-t pt-4">
          <h4 class="font-bold text-sm text-gray-700 mb-2">📋 Daftar Transaksi</h4>
          <table class="w-full text-sm">
            <thead class="bg-gray-100">
              <tr>
                <th class="text-left px-2 py-1 text-xs font-bold text-gray-600">Waktu</th>
                <th class="text-left px-2 py-1 text-xs font-bold text-gray-600">Kasir</th>
                <th class="text-right px-2 py-1 text-xs font-bold text-gray-600">Total</th>
                <th class="text-left px-2 py-1 text-xs font-bold text-gray-600">Metode</th>
              </tr>
            </thead>
            <tbody>
              ${laporan.data.map((sale: any) => `
                <tr class="border-t">
                  <td class="px-2 py-1 text-xs">${new Date(sale.timestamp).toLocaleTimeString('id-ID')}</td>
                  <td class="px-2 py-1 text-xs">${sale.kasirName || '-'}</td>
                  <td class="px-2 py-1 text-right font-bold text-xs">${formatRupiah(sale.totalPrice)}</td>
                  <td class="px-2 py-1 text-xs">${sale.paymentMethod}</td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot class="bg-gray-100 font-bold">
              <tr>
                <td colspan="2" class="px-2 py-1 text-right text-xs">TOTAL</td>
                <td class="px-2 py-1 text-right text-xs">${formatRupiah(laporan.totalOmzet)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div class="text-center text-[10px] text-gray-400 border-t pt-4 mt-4">
          Dicetak pada: ${new Date().toLocaleString('id-ID')}
        </div>
      </div>
    </body>
    </html>
    `;

    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
    } else {
      alert('Mohon izinkan popup untuk mencetak laporan!');
    }
  };

  // ===== FUNGSI DOWNLOAD PDF =====
  const handleDownloadPDF = () => {
    const dataLaporan = {
      shift: shift,
      totalTransaksi: laporan.totalTransaksi,
      totalOmzet: laporan.totalOmzet,
      totalTunai: laporan.totalTunai,
      totalQRIS: laporan.totalQRIS,
      data: laporan.data,
      uangFisik: uangFisik,
      selisih: selisih
    };

    const printContent = buildLaporanHTML(dataLaporan);
    const blob = new Blob([printContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Laporan_Kasir_${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    alert('✅ File HTML laporan siap diunduh! Buka file lalu print sebagai PDF.');
  };

  // ===== FUNGSI SHARE KE WA =====
  const handleShareWA = () => {
    const dataLaporan = {
      shift: shift,
      totalTransaksi: laporan.totalTransaksi,
      totalOmzet: laporan.totalOmzet,
      totalTunai: laporan.totalTunai,
      totalQRIS: laporan.totalQRIS,
      data: laporan.data,
      uangFisik: uangFisik,
      selisih: selisih
    };

    const message = `📊 *Laporan Kasir SISUKA ERP*
📅 Tanggal: ${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
👤 Kasir: ${currentUser?.name || '-'}
📋 Shift: ${shift === 'SEMUA' ? 'SEMUA SHIFT' : shift.toUpperCase()}
📈 Total Transaksi: ${laporan.totalTransaksi}
💰 Total Omzet: ${formatRupiah(laporan.totalOmzet)}
💵 Tunai: ${formatRupiah(laporan.totalTunai)}
📱 QRIS/Transfer: ${formatRupiah(laporan.totalQRIS)}
${uangFisik ? `💵 Uang di Laci: ${formatRupiah(Number(uangFisik))}` : ''}
${uangFisik ? `📊 Selisih: ${formatRupiah(selisih)} (${selisih === 0 ? 'PAS' : selisih > 0 ? 'LEBIH' : 'KURANG'})` : ''}

📎 File laporan lengkap terlampir.
Dicetak dari SISUKA ERP`;

    const waUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
    alert('✅ WhatsApp terbuka! Silakan kirim pesan dan lampirkan file PDF.');
  };

  // ===== FUNGSI BUILD HTML LAPORAN =====
  const buildLaporanHTML = (data: any) => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Laporan Kasir</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: 'Courier New', monospace; 
          padding: 20px; 
          max-width: 800px; 
          margin: 0 auto;
          font-size: 12px;
        }
        .header { 
          text-align: center; 
          border-bottom: 2px solid #000; 
          padding-bottom: 10px; 
          margin-bottom: 15px; 
        }
        .header h1 { font-size: 20px; }
        .header p { font-size: 12px; color: #666; }
        table { 
          width: 100%; 
          border-collapse: collapse; 
          margin: 10px 0; 
        }
        th { 
          background-color: #f0f0f0; 
          padding: 6px 8px; 
          text-align: left; 
          font-size: 11px; 
          border-bottom: 2px solid #000;
        }
        td { 
          padding: 4px 8px; 
          border-bottom: 1px solid #ddd; 
          font-size: 11px; 
        }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .bold { font-weight: bold; }
        .stat-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
          margin: 15px 0;
          text-align: center;
        }
        .stat-box {
          border: 1px solid #ddd;
          padding: 10px;
          border-radius: 4px;
        }
        .stat-box .label { font-size: 10px; color: #999; }
        .stat-box .value { font-size: 16px; font-weight: bold; }
        .total-row { 
          background-color: #f0f0f0; 
          font-weight: bold; 
        }
        .total-row td { border-top: 2px solid #000; }
        .footer { 
          text-align: center; 
          border-top: 2px solid #000; 
          padding-top: 10px; 
          margin-top: 15px; 
          font-size: 10px; 
          color: #999; 
        }
        .selisih-box {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin: 15px 0;
          text-align: center;
          border-top: 1px solid #ddd;
          padding-top: 15px;
        }
        .selisih-box .label { font-size: 10px; color: #999; }
        .selisih-box .value { font-size: 14px; font-weight: bold; }
        .text-green { color: #059669; }
        .text-red { color: #dc2626; }
        @media print {
          body { padding: 10px; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${shopName || 'SISUKA ERP'}</h1>
        <p>LAPORAN KASIR</p>
        <p>${data.shift === 'SEMUA' ? 'SEMUA SHIFT' : 'SHIFT ' + data.shift.toUpperCase()}</p>
        <p>${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
        <p>Kasir: ${currentUser?.name || '-'}</p>
      </div>

      <div class="stat-grid">
        <div class="stat-box">
          <div class="label">Transaksi</div>
          <div class="value">${data.totalTransaksi}</div>
        </div>
        <div class="stat-box">
          <div class="label">Omzet</div>
          <div class="value">${formatRupiah(data.totalOmzet)}</div>
        </div>
        <div class="stat-box">
          <div class="label">Tunai</div>
          <div class="value">${formatRupiah(data.totalTunai)}</div>
        </div>
        <div class="stat-box">
          <div class="label">QRIS/Transfer</div>
          <div class="value">${formatRupiah(data.totalQRIS)}</div>
        </div>
      </div>

      ${data.uangFisik ? `
      <div class="selisih-box">
        <div>
          <div class="label">Uang di Laci</div>
          <div class="value">${formatRupiah(Number(data.uangFisik))}</div>
        </div>
        <div>
          <div class="label">Selisih</div>
          <div class="value ${data.selisih >= 0 ? 'text-green' : 'text-red'}">${formatRupiah(data.selisih)}</div>
        </div>
        <div>
          <div class="label">Status</div>
          <div class="value ${data.selisih === 0 ? 'text-green' : data.selisih > 0 ? 'text-green' : 'text-red'}">${data.selisih === 0 ? '✅ PAS' : data.selisih > 0 ? '✅ LEBIH' : '❌ KURANG'}</div>
        </div>
      </div>
      ` : ''}

      <h3 style="margin-top:15px; font-size:13px;">📋 Daftar Transaksi</h3>
      <table>
        <thead>
          <tr>
            <th style="width:25%">Waktu</th>
            <th style="width:20%">Kasir</th>
            <th style="width:30%; text-align:right">Total</th>
            <th style="width:25%">Metode</th>
          </tr>
        </thead>
        <tbody>
          ${data.data.map((sale: any) => `
            <tr>
              <td>${new Date(sale.timestamp).toLocaleTimeString('id-ID')}</td>
              <td>${sale.kasirName || '-'}</td>
              <td class="text-right bold">${formatRupiah(sale.totalPrice)}</td>
              <td>${sale.paymentMethod}</td>
            </tr>
          `).join('')}
        </tbody>
        <tfoot>
          <tr class="total-row">
            <td colspan="2" class="text-right">TOTAL</td>
            <td class="text-right">${formatRupiah(data.totalOmzet)}</td>
            <td></td>
          </tr>
        </tfoot>
      </table>

      <div class="footer">
        Dicetak pada: ${new Date().toLocaleString('id-ID')}
      </div>
    </body>
    </html>
    `;
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
      {/* Filter Shift */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setShift('SEMUA')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
            shift === 'SEMUA' ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-600'
          }`}
        >
          SEMUA SHIFT
        </button>
        <button
          onClick={() => setShift('Pagi')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
            shift === 'Pagi' ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-600'
          }`}
        >
          🌅 Pagi
        </button>
        <button
          onClick={() => setShift('Siang')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
            shift === 'Siang' ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-600'
          }`}
        >
          ☀️ Siang
        </button>
        <button
          onClick={() => setShift('Malam')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
            shift === 'Malam' ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-600'
          }`}
        >
          🌙 Malam
        </button>
      </div>

      {/* Statistik */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="bg-blue-50 p-4 rounded-xl">
          <p className="text-xs text-gray-500">Transaksi</p>
          <p className="text-2xl font-bold text-blue-600">{laporan.totalTransaksi}</p>
        </div>
        <div className="bg-emerald-50 p-4 rounded-xl">
          <p className="text-xs text-gray-500">Omzet</p>
          <p className="text-2xl font-bold text-emerald-600">{formatRupiah(laporan.totalOmzet)}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-xl">
          <p className="text-xs text-gray-500">💵 Tunai</p>
          <p className="text-xl font-bold text-green-600">{formatRupiah(laporan.totalTunai)}</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-xl">
          <p className="text-xs text-gray-500">📱 QRIS/Transfer</p>
          <p className="text-xl font-bold text-purple-600">{formatRupiah(laporan.totalQRIS)}</p>
        </div>
      </div>

      {/* Cek Uang Fisik */}
      <div className="border-t pt-4">
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="flex-1">
            <label className="text-xs font-bold text-gray-500">💰 Uang di Laci</label>
            <input
              type="number"
              value={uangFisik}
              onChange={(e) => setUangFisik(e.target.value ? Number(e.target.value) : '')}
              placeholder="Masukkan total uang fisik..."
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div className="flex-1 text-center">
            <p className="text-xs text-gray-500">Selisih</p>
            <p className={`text-xl font-bold ${selisih === 0 ? 'text-emerald-600' : selisih > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {uangFisik ? formatRupiah(selisih) : '—'}
            </p>
            {uangFisik && selisih === 0 && <p className="text-[10px] text-emerald-600">✅ Pas!</p>}
            {uangFisik && selisih > 0 && <p className="text-[10px] text-emerald-500">✅ Lebih {formatRupiah(selisih)}</p>}
            {uangFisik && selisih < 0 && <p className="text-[10px] text-red-500">❌ Kurang {formatRupiah(Math.abs(selisih))}</p>}
          </div>
        </div>
      </div>

      {/* Tombol Aksi */}
      <div className="mt-4 flex flex-wrap gap-2">
        <button 
          onClick={() => alert('✅ Setoran telah diselesaikan!')}
          className="flex-1 min-w-[100px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-lg"
        >
          ✅ Setoran Selesai
        </button>
        <button 
          onClick={handlePrint}
          className="flex-1 min-w-[100px] bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg flex items-center justify-center gap-2"
        >
          🖨️ Print
        </button>
        <button 
          onClick={handleDownloadPDF}
          className="flex-1 min-w-[100px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-lg flex items-center justify-center gap-2"
        >
          ⬇️ Download PDF
        </button>
        <button 
          onClick={handleShareWA}
          className="flex-1 min-w-[100px] bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg flex items-center justify-center gap-2"
        >
          📱 Kirim ke WA
        </button>
      </div>

      {/* Daftar Transaksi */}
      {laporan.data && laporan.data.length > 0 && (
        <div className="mt-4 border-t pt-4">
          <h4 className="font-bold text-sm text-gray-700 mb-2">📋 Transaksi</h4>
          <div className="max-h-48 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-2 py-1 text-[10px] font-bold text-gray-400">Waktu</th>
                  <th className="text-left px-2 py-1 text-[10px] font-bold text-gray-400">Kasir</th>
                  <th className="text-right px-2 py-1 text-[10px] font-bold text-gray-400">Total</th>
                  <th className="text-left px-2 py-1 text-[10px] font-bold text-gray-400">Metode</th>
                </tr>
              </thead>
              <tbody>
                {laporan.data.map((sale: any) => (
                  <tr key={sale.id} className="border-t">
                    <td className="px-2 py-1 text-xs">{new Date(sale.timestamp).toLocaleTimeString('id-ID')}</td>
                    <td className="px-2 py-1 text-xs">{sale.kasirName || '-'}</td>
                    <td className="px-2 py-1 text-right font-bold">{formatRupiah(sale.totalPrice)}</td>
                    <td className="px-2 py-1 text-xs">{sale.paymentMethod}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

  // ===== FORMAT RUPIAH =====
  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(angka);
  };

  // ===== CEK LOGIN =====
  if (!isLoggedIn || !currentUser) {
    return <LoginKasir onLogin={(user) => {
      setCurrentUser(user);
      setIsLoggedIn(true);
    }} />;
  }

  // ===== RENDER =====
  return (
    <div className="flex h-[calc(100vh-52px)] bg-gray-50 text-gray-900 font-sans print:bg-white print:text-black">
      
      {/* ===== SIDEBAR ===== */}
      <div className="w-64 bg-emerald-700 text-white p-4 flex flex-col flex-shrink-0 print:hidden">
        <div className="mb-8">
          {logoUrl && (
            <img src={logoUrl} alt="Logo" className="w-12 h-12 rounded-full mb-2" />
          )}
          <h1 className="text-xl font-bold">{shopName}</h1>
          <p className="text-xs text-emerald-200">POS System</p>
        </div>
        
        <nav className="flex-1 space-y-2">
          <Link href="/kasir">
            <button className="w-full bg-emerald-600 text-white px-4 py-2.5 rounded-lg flex items-center gap-3">
              <ShoppingCart className="w-5 h-5" /> Kasir Jualan
            </button>
          </Link>
          <Link href="/stok">
            <button className="w-full hover:bg-emerald-600 px-4 py-2.5 rounded-lg flex items-center gap-3 transition">
              <Package className="w-5 h-5" /> Stok Gudang
            </button>
          </Link>
          <Link href="/">
            <button className="w-full hover:bg-emerald-600 px-4 py-2.5 rounded-lg flex items-center gap-3 transition">
              <Landmark className="w-5 h-5" /> Dashboard Owner
            </button>
          </Link>
           {/* ===== TAMBAHKAN INI ===== */}
  <Link href="/kasir/management">
    <button className="w-full hover:bg-emerald-600 px-4 py-2.5 rounded-lg flex items-center gap-3 transition">
      <UserIcon className="w-5 h-5" /> Manajemen Kasir
    </button>
  </Link>
        </nav>
        
        <button className="w-full hover:bg-emerald-600 px-4 py-2.5 rounded-lg flex items-center gap-3 transition mt-auto">
          <LogOut className="w-5 h-5" /> Keluar
        </button>
      </div>

      {/* ===== MAIN CONTENT ===== */}
      <div className="flex-1 flex flex-col p-6 overflow-hidden print:hidden">
        
        {/* TAB NAVIGATION */}
        <div className="flex gap-2 mb-4 bg-white p-2 rounded-xl border border-gray-200">
          <button
            onClick={() => setActiveTab('kasir')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition ${
              activeTab === 'kasir' 
                ? 'bg-emerald-600 text-white' 
                : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            🛒 Kasir
          </button>
          <button
            onClick={() => setActiveTab('laporan')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition ${
              activeTab === 'laporan' 
                ? 'bg-emerald-600 text-white' 
                : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            📊 Laporan Kasir
          </button>
        </div>

        {/* KONTEN */}
        {activeTab === 'kasir' ? (
          // ===== KONTEN KASIR =====
          <>
            {/* HEADER */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-4">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-bold text-gray-800">🛒 Kasir</h2>
                <div className="relative w-64">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Cari produk (nama/SKU)..."
                    className="pl-9 pr-4 py-2 border rounded-lg w-full text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg">
                  👤 {currentUser.name} - Shift {currentUser.shift}
                </span>
                <button
                  onClick={() => {
                    setIsLoggedIn(false);
                    setCurrentUser(null);
                  }}
                  className="text-xs text-red-500 hover:text-red-700 font-bold"
                >
                  Logout
                </button>

                <button
                  onClick={() => {
                    if (cart.length > 0) {
                      printThermalReceipt(`INV-${Date.now().toString().slice(-6)}`);
                    } else {
                      alert('Keranjang kosong!');
                    }
                  }}
                  className="bg-white hover:bg-gray-100 text-gray-700 font-bold text-xs px-4 py-2 rounded-xl border shadow-sm flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" /> CETAK STRUK
                </button>

                <div className="flex flex-wrap bg-gray-200/80 p-1 rounded-xl border border-gray-300 text-[10px] font-bold shadow-inner gap-1">
                  <button
                    type="button"
                    onClick={() => setSelectedCategory('ALL')}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      selectedCategory === 'ALL' 
                        ? 'bg-white text-emerald-700 shadow-sm' 
                        : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    ALL
                  </button>
                  {categories.map((cat) => (
                    <button
                      type="button"
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.name)}
                      className={`px-3 py-1.5 rounded-lg transition uppercase ${
                        selectedCategory === cat.name 
                          ? 'bg-white text-emerald-700 shadow-sm' 
                          : 'text-gray-500 hover:text-gray-800'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* GRID PRODUK */}
            <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-3 gap-4 pb-4">
              {filteredProducts.length === 0 ? (
                <div className="col-span-3 flex flex-col items-center justify-center text-gray-400 h-64">
                  <Package className="w-12 h-12 mb-2 stroke-1" />
                  <p className="text-sm">Produk tidak ditemukan di kategori ini</p>
                </div>
              ) : (
                filteredProducts.map((product) => (
                  <div 
                    key={product.id} 
                    onClick={() => addToCart(product)}
                    className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:border-emerald-500 cursor-pointer transition flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-mono font-bold border">
                          {product.sku}
                        </span>
                        <span className="text-[9px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                          {product.category}
                        </span>
                      </div>
                      <h3 className="font-bold text-gray-800 text-xs line-clamp-2">{product.name}</h3>
                    </div>
                    <div className="mt-4 flex justify-between items-end border-t pt-2 border-gray-100">
                      <div>
                        <p className={`text-[10px] font-bold ${product.stock <= 5 ? 'text-red-500' : 'text-gray-400'}`}>
                          Stok: {product.stock} {product.units}
                        </p>
                        <p className="text-sm font-black text-emerald-600">
                          Rp {product.price.toLocaleString('id-ID')}
                        </p>
                      </div>
                      <button type="button" className="bg-emerald-50 text-emerald-700 px-2.5 py-1 text-xs font-bold rounded-lg">
                        + Pilih
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          // ===== KONTEN LAPORAN KASIR =====
          <div className="flex-1 overflow-y-auto">
            <LaporanKasir />
          </div>
        )}
      </div>

      {/* ===== KERANJANG ===== */}
      <div className="w-96 bg-white border-l border-gray-200 flex flex-col shadow-xl print:hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-emerald-50">
          <div className="flex items-center gap-2">
            <ShoppingCart className="text-emerald-700 w-5 h-5" />
            <h2 className="font-black text-emerald-900 text-base">Keranjang POS</h2>
          </div>
          <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            {cart.length} Item
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <ShoppingBag className="w-12 h-12 mb-2 stroke-1 text-gray-300" />
              <p className="text-xs">Kasir siap melayani pembeli</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="flex justify-between items-center bg-gray-50 p-2.5 rounded-xl border border-gray-200">
                <div className="max-w-[170px]">
                  <h4 className="font-bold text-xs text-gray-800 truncate">{item.name}</h4>
                  <p className="text-[10px] font-bold text-emerald-600">
                    Rp {item.price.toLocaleString('id-ID')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuantity(item.id, -1)}
                    className="bg-gray-200 hover:bg-gray-300 rounded-full w-6 h-6 flex items-center justify-center"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="font-bold w-5 text-center text-sm">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, 1)}
                    className="bg-gray-200 hover:bg-gray-300 rounded-full w-6 h-6 flex items-center justify-center"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-red-400 hover:text-red-600 ml-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* ===== BAGIAN PEMBAYARAN ===== */}
        <div className="p-4 border-t border-gray-200 bg-white">
          <div className="flex justify-between mb-1">
            <span className="text-sm text-gray-500">Subtotal</span>
            <span className="font-bold text-sm">{formatRupiah(totalPrice)}</span>
          </div>
          <div className="flex justify-between mb-3">
            <span className="text-sm text-gray-500">Total</span>
            <span className="text-lg font-black text-emerald-600">{formatRupiah(totalPrice)}</span>
          </div>

          {/* Tombol Metode Pembayaran */}
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => setPaymentMethod('Tunai')}
              className={`flex-1 py-2 rounded-lg font-bold text-sm transition flex items-center justify-center gap-1 ${
                paymentMethod === 'Tunai'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
              }`}
            >
              <Banknote className="w-4 h-4" /> Tunai
            </button>
            <button
              onClick={() => setPaymentMethod('QRIS / Transfer')}
              className={`flex-1 py-2 rounded-lg font-bold text-sm transition flex items-center justify-center gap-1 ${
                paymentMethod === 'QRIS / Transfer'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
              }`}
            >
              <QrCode className="w-4 h-4" /> QRIS
            </button>
          </div>

          {/* Input Uang Tunai */}
          {paymentMethod === 'Tunai' && (
            <div className="mt-2">
              <input
                type="number"
                value={cashReceived}
                onChange={(e) => setCashReceived(e.target.value ? Number(e.target.value) : '')}
                placeholder="Jumlah uang diterima"
                className="w-full border rounded-lg px-3 py-2 text-sm text-black font-bold placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                style={{ color: '#000000' }}
              />
              {cashReceived !== '' && Number(cashReceived) >= totalPrice && (
                <p className="text-sm text-emerald-600 mt-1 font-bold">
                  Kembali: {formatRupiah(cashReturn)}
                </p>
              )}
              {cashReceived !== '' && Number(cashReceived) < totalPrice && (
                <p className="text-sm text-red-500 mt-1 font-bold">
                  Kurang: {formatRupiah(totalPrice - Number(cashReceived))}
                </p>
              )}
            </div>
          )}

          <button
            onClick={handleCheckout}
            disabled={cart.length === 0}
            className={`w-full mt-3 py-2.5 rounded-lg font-bold text-white ${
              cart.length === 0
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            Bayar Sekarang
          </button>
        </div>
      </div>

      {/* ===== MODAL INVOICE ===== */}
      {showInvoice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Check className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">Transaksi Berhasil!</h3>
              <p className="text-sm text-gray-500">No. Invoice: {currentInvoiceNo}</p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-xl mb-4">
              <p className="text-sm text-gray-600">Total Pembayaran</p>
              <p className="text-2xl font-bold text-emerald-600">
                {formatRupiah(lastTransaction?.total || 0)}
              </p>
              <p className="text-xs text-gray-400 mt-1">Metode: {lastTransaction?.method || '-'}</p>
              <p className="text-xs text-gray-400">Kasir: {currentUser?.name || '-'}</p>
            </div>

            <button
              onClick={() => {
                setShowInvoice(false);
                setLastTransaction(null);
              }}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-lg"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}