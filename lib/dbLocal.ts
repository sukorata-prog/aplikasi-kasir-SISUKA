import Dexie, { Table } from 'dexie';

export interface LocalProduct {
  id: string;
  name: string;
  sku: string;
  category: string; 
  units: string; 
  stock: number;
  purchasePrice: number; 
  price: number;         
  is_seasonal: boolean; 
  supplier?: string;      // Nama supplier
  minStock?: number;      // Minimum stok peringatan
  location?: string;      // Lokasi rak penyimpanan
}

export interface LocalSale {
  id: string;
  timestamp: number;
  paymentMethod: 'Tunai' | 'QRIS / Transfer';
  kasirId: string;      // ✅ TAMBAHKAN
  kasirName: string;    // ✅ TAMBAHKAN
  shift: 'Pagi' | 'Siang' | 'Malam';  // ✅ TAMBAHKAN
  items: {
    productId: string;
    name: string;
    quantity: number;
    purchasePrice: number; 
    price: number;         
    units: string;
  }[];
  totalPrice: number;
}

export interface OperationalExpense {
  id: string;
  timestamp: number;
  type: 'Gaji Karyawan' | 'Listrik & Air' | 'Internet' | 'BBM & Transportasi' | 'Lainnya';
  amount: number;
  note: string;
}

export interface DynamicCategory {
  id: string;
  name: string; 
}

export interface ShopConfig {
  id: string;
  shopName: string;
  logoBase64: string;
  isPremium?: boolean;
}

// ===== BUKU BESAR =====
export interface JurnalEntry {
  id: string;
  tanggal: string;
  keterangan: string;
  akun: string;
  debit: number;
  kredit: number;
  ref?: string;
  createdAt: number;
}

export interface Akun {
  id: string;
  kode: string;
  nama: string;
  tipe: 'ASET' | 'KEWAJIBAN' | 'EKUITAS' | 'PENDAPATAN' | 'BEBAN';
  saldoNormal: 'DEBIT' | 'KREDIT';
  saldo: number;
}

// ===== USER KASIR =====
export interface User {
  id: string;
  name: string;
  role: 'OWNER' | 'MANAGER' | 'KASIR';
  shift: 'Pagi' | 'Siang' | 'Malam' | null;
  pin: string;
  isActive: boolean;
  createdAt: number;
}

// ===== CLASS DATABASE =====
class SisukaERPDB extends Dexie {
  products!: Table<LocalProduct, string>;
  sales!: Table<LocalSale, string>;
  expenses!: Table<OperationalExpense, string>;
  categories!: Table<DynamicCategory, string>;
  config!: Table<ShopConfig, string>;
  jurnal!: Table<JurnalEntry, string>;
  akun!: Table<Akun, string>;
  users!: Table<User, string>;

  constructor() {
    super('SisukaERPDB');
    
    // VERSI 1: Struktur awal
    this.version(1).stores({
      products: 'id, name, sku, category, stock',
      sales: 'id, timestamp, paymentMethod, totalPrice',
      expenses: 'id, timestamp, type, amount',
      categories: 'id, name',
      config: 'id'
    });
    
    // VERSI 2: Tambah jurnal, akun, dan users
    this.version(2).stores({
      products: 'id, name, sku, category, stock',
      sales: 'id, timestamp, paymentMethod, totalPrice',
      expenses: 'id, timestamp, type, amount',
      categories: 'id, name',
      config: 'id',
      jurnal: 'id, tanggal, akun, keterangan, createdAt',
      akun: 'id, kode, nama, tipe',
      users: 'id, name, role, shift, isActive'
    }).upgrade(async (tx) => {
      // Inisialisasi akun default saat upgrade
      const defaultAkun: Akun[] = [
        // ASET
        { id: '1', kode: '1-1000', nama: 'Kas', tipe: 'ASET', saldoNormal: 'DEBIT', saldo: 0 },
        { id: '2', kode: '1-1100', nama: 'Piutang Usaha', tipe: 'ASET', saldoNormal: 'DEBIT', saldo: 0 },
        { id: '3', kode: '1-1200', nama: 'Persediaan Barang', tipe: 'ASET', saldoNormal: 'DEBIT', saldo: 0 },
        { id: '4', kode: '1-1300', nama: 'Perlengkapan Toko', tipe: 'ASET', saldoNormal: 'DEBIT', saldo: 0 },
        { id: '5', kode: '1-1400', nama: 'Peralatan Toko', tipe: 'ASET', saldoNormal: 'DEBIT', saldo: 0 },
        // KEWAJIBAN
        { id: '6', kode: '2-2000', nama: 'Hutang Usaha', tipe: 'KEWAJIBAN', saldoNormal: 'KREDIT', saldo: 0 },
        { id: '7', kode: '2-2100', nama: 'Hutang Bank', tipe: 'KEWAJIBAN', saldoNormal: 'KREDIT', saldo: 0 },
        // EKUITAS
        { id: '8', kode: '3-3000', nama: 'Modal Pemilik', tipe: 'EKUITAS', saldoNormal: 'KREDIT', saldo: 0 },
        { id: '9', kode: '3-3100', nama: 'Prive', tipe: 'EKUITAS', saldoNormal: 'DEBIT', saldo: 0 },
        { id: '10', kode: '3-3200', nama: 'Laba Ditahan', tipe: 'EKUITAS', saldoNormal: 'KREDIT', saldo: 0 },
        // PENDAPATAN
        { id: '11', kode: '4-4000', nama: 'Pendapatan Penjualan', tipe: 'PENDAPATAN', saldoNormal: 'KREDIT', saldo: 0 },
        { id: '12', kode: '4-4100', nama: 'Pendapatan Jasa', tipe: 'PENDAPATAN', saldoNormal: 'KREDIT', saldo: 0 },
        // BEBAN
        { id: '13', kode: '5-5000', nama: 'Beban Gaji', tipe: 'BEBAN', saldoNormal: 'DEBIT', saldo: 0 },
        { id: '14', kode: '5-5100', nama: 'Beban Listrik & Air', tipe: 'BEBAN', saldoNormal: 'DEBIT', saldo: 0 },
        { id: '15', kode: '5-5200', nama: 'Beban Internet', tipe: 'BEBAN', saldoNormal: 'DEBIT', saldo: 0 },
        { id: '16', kode: '5-5300', nama: 'Beban BBM & Transportasi', tipe: 'BEBAN', saldoNormal: 'DEBIT', saldo: 0 },
        { id: '17', kode: '5-5400', nama: 'Beban Sewa', tipe: 'BEBAN', saldoNormal: 'DEBIT', saldo: 0 },
        { id: '18', kode: '5-5500', nama: 'Beban Iklan & Promosi', tipe: 'BEBAN', saldoNormal: 'DEBIT', saldo: 0 },
        { id: '19', kode: '5-5600', nama: 'Beban Perlengkapan', tipe: 'BEBAN', saldoNormal: 'DEBIT', saldo: 0 },
        { id: '20', kode: '5-5700', nama: 'Beban Lain-lain', tipe: 'BEBAN', saldoNormal: 'DEBIT', saldo: 0 },
        { id: '21', kode: '5-5800', nama: 'Beban HPP', tipe: 'BEBAN', saldoNormal: 'DEBIT', saldo: 0 },
      ];
      
      const akunTable = tx.table('akun');
      const count = await akunTable.count();
      if (count === 0) {
        for (const a of defaultAkun) {
          await akunTable.add(a);
        }
      }
    });
    
    // ===== VERSI 3: Tambah kasirId, kasirName, shift di sales =====
    this.version(3).stores({
      products: 'id, name, sku, category, stock',
      sales: 'id, timestamp, paymentMethod, totalPrice, kasirId, shift',
      expenses: 'id, timestamp, type, amount',
      categories: 'id, name',
      config: 'id',
      jurnal: 'id, tanggal, akun, keterangan, createdAt',
      akun: 'id, kode, nama, tipe',
      users: 'id, name, role, shift, isActive'
    }).upgrade(async (tx) => {
      console.log('✅ Database upgrade ke versi 3 berhasil!');
      console.log('📝 Field baru: kasirId, kasirName, shift di tabel sales');
    });
  }
}

export const dbLocal = new SisukaERPDB();