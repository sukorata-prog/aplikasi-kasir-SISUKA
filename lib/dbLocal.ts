import Dexie, { Table } from 'dexie';

// 1. Struktur Produk Terintegrasi (Kategori sesuai BRD + Herbisida)
export interface LocalProduct {
  id: string;
  name: string;
  sku: string;
  category: 'Pupuk' | 'Insektisida' | 'Fungisida' | 'Herbisida' | 'Alat Pertanian';
  units: string; 
  stock: number;
  purchasePrice: number; // Harga Beli Modal Pabrik
  price: number;         // Harga Jual Eceran Toko
  is_seasonal: boolean; 
}

// 2. Struktur Transaksi Penjualan Kasir (POS)
export interface LocalSale {
  id: string;
  timestamp: number;
  paymentMethod: 'Tunai' | 'QRIS / Transfer';
  items: {
    productId: string;
    name: string;
    quantity: number;
    purchasePrice: number; // Mengunci modal saat transaksi terjadi
    price: number;         // Mengunci harga jual saat transaksi terjadi
    units: string;
  }[];
  totalPrice: number;
}

// 3. Struktur Pengeluaran Biaya Operasional (BRD Poin 15)
export interface OperationalExpense {
  id: string;
  timestamp: number;
  type: 'Gaji Karyawan' | 'Listrik & Air' | 'Internet' | 'BBM & Transportasi' | 'Lainnya';
  amount: number;
  note: string;
}

// 4. Struktur Konfigurasi Merek Toko (White-Label)
export interface ShopConfig {
  id: string;
  shopName: string;
  logoBase64: string;
}

class SisukaERPDB extends Dexie {
  products!: Table<LocalProduct>;
  sales!: Table<LocalSale>;
  expenses!: Table<OperationalExpense>; // <-- Tabel Biaya Operasional Baru
  config!: Table<ShopConfig>;

  constructor() {
    super('SisukaERPDB'); // Ganti nama DB agar fresh dan bersih dari cache lama
    this.version(1).stores({
      products: 'id, name, sku, category, stock', 
      sales: 'id, timestamp, paymentMethod, totalPrice',
      expenses: 'id, timestamp, type',
      config: 'id'
    });
  }
}

export const dbLocal = new SisukaERPDB();
