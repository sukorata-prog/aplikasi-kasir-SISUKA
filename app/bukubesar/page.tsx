"use client";

import React, { useState, useEffect } from 'react';
import { dbLocal } from '@/lib/dbLocal';
import { 
  BookOpen, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Printer,
  ChevronDown,
  ChevronRight,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  FileText,
  Landmark,
  Package,
  ShoppingCart,
  LogOut,
  X,
  Check,
  Edit,
  Trash2
} from 'lucide-react';
import Link from 'next/link';
import * as XLSX from 'xlsx';

// ===== TIPE DATA =====
interface JurnalEntry {
  id: string;
  tanggal: string;
  keterangan: string;
  akun: string;
  debit: number;
  kredit: number;
  ref?: string;
  createdAt: number;
}

interface Akun {
  id: string;
  kode: string;
  nama: string;
  tipe: 'ASET' | 'KEWAJIBAN' | 'EKUITAS' | 'PENDAPATAN' | 'BEBAN';
  saldoNormal: 'DEBIT' | 'KREDIT';
  saldo: number;
}

export default function BukuBesarPage() {
  // ===== STATE =====
  const [jurnal, setJurnal] = useState<JurnalEntry[]>([]);
  const [filteredJurnal, setFilteredJurnal] = useState<JurnalEntry[]>([]);
  const [akun, setAkun] = useState<Akun[]>([]);
  const [activeTab, setActiveTab] = useState<'jurnal' | 'bukuBesar' | 'neracaSaldo' | 'laporan'>('jurnal');
  
  // Filter
  const [startDate, setStartDate] = useState<string>(() => {
    const date = new Date();
    date.setDate(1);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [selectedAkun, setSelectedAkun] = useState<string>('SEMUA');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Form Jurnal
  const [showForm, setShowForm] = useState<boolean>(false);
  const [formData, setFormData] = useState<{
    tanggal: string;
    keterangan: string;
    akunDebit: string;
    akunKredit: string;
    nominal: number | '';
  }>({
    tanggal: new Date().toISOString().split('T')[0],
    keterangan: '',
    akunDebit: '',
    akunKredit: '',
    nominal: ''
  });

  const [shopName, setShopName] = useState('SISUKA ERP');
  const [logoUrl, setLogoUrl] = useState('');

  // ===== LOAD DATA =====
  useEffect(() => {
    loadData();
    initializeAkun();
  }, []);

  const loadData = async () => {
    try {
      const savedJurnal = await dbLocal.jurnal?.toArray() || [];
      setJurnal(savedJurnal);
      setFilteredJurnal(savedJurnal);
      
      const savedConfig = await dbLocal.config?.get('shop_settings');
      if (savedConfig) {
        setShopName(savedConfig.shopName || 'SISUKA ERP');
        setLogoUrl(savedConfig.logoBase64 || '');
      }
    } catch (err) {
      console.error("Gagal memuat data:", err);
    }
  };

  // ===== INISIALISASI AKUN =====
  const initializeAkun = async () => {
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
    ];

    // Simpan ke database jika belum ada
    const existing = await dbLocal.akun?.toArray() || [];
    if (existing.length === 0) {
      for (const a of defaultAkun) {
        await dbLocal.akun?.add(a);
      }
      setAkun(defaultAkun);
    } else {
      setAkun(existing);
    }
  };

  // ===== FILTER =====
  useEffect(() => {
    let filtered = jurnal;
    
    // Filter tanggal
    if (startDate && endDate) {
      filtered = filtered.filter(j => j.tanggal >= startDate && j.tanggal <= endDate);
    }
    
    // Filter akun
    if (selectedAkun !== 'SEMUA') {
      filtered = filtered.filter(j => j.akun === selectedAkun);
    }
    
    // Filter search
    if (searchTerm) {
      filtered = filtered.filter(j => 
        j.keterangan.toLowerCase().includes(searchTerm.toLowerCase()) ||
        j.akun.toLowerCase().includes(searchTerm.toLowerCase()) ||
        j.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredJurnal(filtered);
  }, [jurnal, startDate, endDate, selectedAkun, searchTerm]);

  // ===== FUNGSI CRUD JURNAL =====
  const handleSubmitJurnal = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.tanggal || !formData.keterangan || !formData.akunDebit || !formData.akunKredit || !formData.nominal) {
      alert('Semua field wajib diisi!');
      return;
    }

    const nominal = Number(formData.nominal);
    
    const entry: JurnalEntry = {
      id: `JRN-${Date.now().toString().slice(-6)}`,
      tanggal: formData.tanggal,
      keterangan: formData.keterangan,
      akun: formData.akunDebit,
      debit: nominal,
      kredit: 0,
      ref: formData.akunKredit,
      createdAt: Date.now()
    };

    const entry2: JurnalEntry = {
      id: `JRN-${Date.now().toString().slice(-6)}-K`,
      tanggal: formData.tanggal,
      keterangan: formData.keterangan,
      akun: formData.akunKredit,
      debit: 0,
      kredit: nominal,
      ref: formData.akunDebit,
      createdAt: Date.now()
    };

    try {
      await dbLocal.jurnal?.add(entry);
      await dbLocal.jurnal?.add(entry2);
      await loadData();
      
      setFormData({
        tanggal: new Date().toISOString().split('T')[0],
        keterangan: '',
        akunDebit: '',
        akunKredit: '',
        nominal: ''
      });
      setShowForm(false);
      alert('✅ Jurnal berhasil ditambahkan!');
    } catch (err) {
      console.error(err);
      alert('Gagal menambahkan jurnal!');
    }
  };

  const handleDeleteJurnal = async (id: string) => {
    if (confirm('Hapus entry jurnal ini?')) {
      try {
        await dbLocal.jurnal?.delete(id);
        await loadData();
        alert('Jurnal dihapus!');
      } catch (err) {
        console.error(err);
        alert('Gagal hapus jurnal!');
      }
    }
  };

  // ===== HITUNG SALDO AKUN =====
  const hitungSaldoAkun = () => {
    const saldoAkun: { [key: string]: number } = {};
    
    akun.forEach(a => {
      const totalDebit = filteredJurnal
        .filter(j => j.akun === a.nama)
        .reduce((sum, j) => sum + j.debit, 0);
      
      const totalKredit = filteredJurnal
        .filter(j => j.akun === a.nama)
        .reduce((sum, j) => sum + j.kredit, 0);
      
      saldoAkun[a.nama] = a.saldoNormal === 'DEBIT' 
        ? totalDebit - totalKredit 
        : totalKredit - totalDebit;
    });
    
    return saldoAkun;
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

  // ===== EKSPOR EXCEL =====
  const exportToExcel = () => {
    const excelData = filteredJurnal.map(j => ({
      'Tanggal': j.tanggal,
      'ID': j.id,
      'Keterangan': j.keterangan,
      'Akun': j.akun,
      'Debit': j.debit,
      'Kredit': j.kredit,
      'Ref': j.ref || '-'
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);
    ws['!cols'] = [
      { wch: 15 }, { wch: 18 }, { wch: 35 }, { wch: 25 }, { wch: 18 }, { wch: 18 }, { wch: 18 }
    ];
    XLSX.utils.book_append_sheet(wb, ws, 'Buku Besar');
    XLSX.writeFile(wb, `buku_besar_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // ===== RENDER JURNAL UMUM =====
  const renderJurnal = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-bold text-gray-800">📋 Jurnal Umum</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3 py-1.5 rounded-lg flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" /> Tambah Jurnal
        </button>
      </div>

      {/* FORM JURNAL */}
      {showForm && (
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <form onSubmit={handleSubmitJurnal} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-600">Tanggal</label>
              <input
                type="date"
                value={formData.tanggal}
                onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600">Keterangan</label>
              <input
                type="text"
                value={formData.keterangan}
                onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                placeholder="Deskripsi transaksi..."
                className="w-full border rounded-lg px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600">Akun Debit</label>
              <select
                value={formData.akunDebit}
                onChange={(e) => setFormData({ ...formData, akunDebit: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm"
                required
              >
                <option value="">Pilih Akun Debit</option>
                {akun.filter(a => a.saldoNormal === 'DEBIT').map(a => (
                  <option key={a.id} value={a.nama}>{a.kode} - {a.nama}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600">Akun Kredit</label>
              <select
                value={formData.akunKredit}
                onChange={(e) => setFormData({ ...formData, akunKredit: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm"
                required
              >
                <option value="">Pilih Akun Kredit</option>
                {akun.filter(a => a.saldoNormal === 'KREDIT').map(a => (
                  <option key={a.id} value={a.nama}>{a.kode} - {a.nama}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600">Nominal (Rp)</label>
              <input
                type="number"
                value={formData.nominal}
                onChange={(e) => setFormData({ ...formData, nominal: e.target.value ? Number(e.target.value) : '' })}
                placeholder="0"
                className="w-full border rounded-lg px-3 py-2 text-sm"
                required
              />
            </div>
            <div className="flex items-end gap-2">
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-lg text-sm flex-1"
              >
                Simpan Jurnal
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold px-4 py-2 rounded-lg text-sm"
              >
                Batal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TABEL JURNAL */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Cari jurnal..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border rounded-lg px-3 py-1.5 text-sm w-48"
            />
            <select
              value={selectedAkun}
              onChange={(e) => setSelectedAkun(e.target.value)}
              className="border rounded-lg px-3 py-1.5 text-sm"
            >
              <option value="SEMUA">Semua Akun</option>
              {akun.map(a => (
                <option key={a.id} value={a.nama}>{a.kode} - {a.nama}</option>
              ))}
            </select>
          </div>
          <button
            onClick={exportToExcel}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3 py-1.5 rounded-lg flex items-center gap-1"
          >
            <Download className="w-3.5 h-3.5" /> Ekspor Excel
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-bold text-gray-700">Tanggal</th>
                <th className="text-left px-4 py-3 font-bold text-gray-700">ID</th>
                <th className="text-left px-4 py-3 font-bold text-gray-700">Keterangan</th>
                <th className="text-left px-4 py-3 font-bold text-gray-700">Akun</th>
                <th className="text-right px-4 py-3 font-bold text-gray-700">Debit</th>
                <th className="text-right px-4 py-3 font-bold text-gray-700">Kredit</th>
                <th className="text-center px-4 py-3 font-bold text-gray-700">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredJurnal.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-400">
                    <BookOpen className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>Belum ada jurnal</p>
                  </td>
                </tr>
              ) : (
                filteredJurnal.map((j, index) => (
                  <tr key={j.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-3 text-gray-700">{j.tanggal}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{j.id}</td>
                    <td className="px-4 py-3 text-gray-700">{j.keterangan}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{j.akun}</td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-600">
                      {j.debit > 0 ? formatRupiah(j.debit) : '-'}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-red-600">
                      {j.kredit > 0 ? formatRupiah(j.kredit) : '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleDeleteJurnal(j.id)}
                        className="text-red-400 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot className="bg-gray-100 font-bold">
              <tr>
                <td colSpan={4} className="px-4 py-3 text-right">Total</td>
                <td className="px-4 py-3 text-right text-emerald-600">
                  {formatRupiah(filteredJurnal.reduce((sum, j) => sum + j.debit, 0))}
                </td>
                <td className="px-4 py-3 text-right text-red-600">
                  {formatRupiah(filteredJurnal.reduce((sum, j) => sum + j.kredit, 0))}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );

  // ===== RENDER BUKU BESAR =====
  const renderBukuBesar = () => {
    const saldoAkun = hitungSaldoAkun();
    
    return (
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-gray-800">📒 Buku Besar per Akun</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {akun.map(a => {
            const saldo = saldoAkun[a.nama] || 0;
            const isSaldoNormal = (a.saldoNormal === 'DEBIT' && saldo >= 0) || (a.saldoNormal === 'KREDIT' && saldo >= 0);
            
            return (
              <div key={a.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400">{a.kode}</p>
                    <h4 className="font-bold text-gray-800 text-sm">{a.nama}</h4>
                    <p className="text-[10px] font-medium text-gray-400">{a.tipe}</p>
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                    a.saldoNormal === 'DEBIT' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'
                  }`}>
                    {a.saldoNormal}
                  </span>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className={`text-xl font-bold ${isSaldoNormal ? 'text-emerald-600' : 'text-red-600'}`}>
                    {formatRupiah(Math.abs(saldo))}
                  </p>
                  <p className="text-[10px] text-gray-400">
                    {saldo >= 0 ? 'Saldo Normal' : 'Saldo Berlawanan'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ===== RENDER NERACA SALDO =====
  const renderNeracaSaldo = () => {
    const saldoAkun = hitungSaldoAkun();
    let totalDebit = 0;
    let totalKredit = 0;
    
    const rows = akun.map(a => {
      const saldo = saldoAkun[a.nama] || 0;
      if (a.saldoNormal === 'DEBIT') {
        totalDebit += Math.abs(saldo);
        return { ...a, saldo: Math.abs(saldo), jenis: 'DEBIT' };
      } else {
        totalKredit += Math.abs(saldo);
        return { ...a, saldo: Math.abs(saldo), jenis: 'KREDIT' };
      }
    });

    return (
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-gray-800">⚖️ Neraca Saldo</h3>
        
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 font-bold text-gray-700">Kode</th>
                  <th className="text-left px-4 py-3 font-bold text-gray-700">Akun</th>
                  <th className="text-right px-4 py-3 font-bold text-gray-700">Debit</th>
                  <th className="text-right px-4 py-3 font-bold text-gray-700">Kredit</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={row.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-3 text-gray-600">{row.kode}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{row.nama}</td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-600">
                      {row.jenis === 'DEBIT' ? formatRupiah(row.saldo) : '-'}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-red-600">
                      {row.jenis === 'KREDIT' ? formatRupiah(row.saldo) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-100 font-bold">
                <tr>
                  <td colSpan={2} className="px-4 py-3 text-right">Total</td>
                  <td className="px-4 py-3 text-right text-emerald-600">{formatRupiah(totalDebit)}</td>
                  <td className="px-4 py-3 text-right text-red-600">{formatRupiah(totalKredit)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // ===== RENDER LAPORAN KEUANGAN =====
  const renderLaporan = () => {
    const saldoAkun = hitungSaldoAkun();
    
    // Pendapatan
    const pendapatan = akun
      .filter(a => a.tipe === 'PENDAPATAN')
      .reduce((sum, a) => sum + (saldoAkun[a.nama] || 0), 0);
    
    // Beban
    const beban = akun
      .filter(a => a.tipe === 'BEBAN')
      .reduce((sum, a) => sum + Math.abs(saldoAkun[a.nama] || 0), 0);
    
    // Laba/Rugi
    const labaRugi = pendapatan - beban;
    
    // Aset
    const aset = akun
      .filter(a => a.tipe === 'ASET')
      .reduce((sum, a) => sum + Math.abs(saldoAkun[a.nama] || 0), 0);
    
    // Kewajiban
    const kewajiban = akun
      .filter(a => a.tipe === 'KEWAJIBAN')
      .reduce((sum, a) => sum + Math.abs(saldoAkun[a.nama] || 0), 0);
    
    // Ekuitas
    const ekuitas = akun
      .filter(a => a.tipe === 'EKUITAS')
      .reduce((sum, a) => sum + Math.abs(saldoAkun[a.nama] || 0), 0);

    return (
      <div className="space-y-6">
        <h3 className="text-sm font-bold text-gray-800">📊 Laporan Keuangan</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* LABA RUGI */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <h4 className="font-bold text-gray-700 mb-3">📈 Laba Rugi</h4>
            <div className="space-y-2">
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Pendapatan</span>
                <span className="font-bold text-emerald-600">{formatRupiah(pendapatan)}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Beban</span>
                <span className="font-bold text-red-600">{formatRupiah(beban)}</span>
              </div>
              <div className="flex justify-between py-2 font-bold text-lg">
                <span>Laba / (Rugi) Bersih</span>
                <span className={labaRugi >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                  {formatRupiah(labaRugi)}
                </span>
              </div>
            </div>
          </div>
          
          {/* NERACA */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <h4 className="font-bold text-gray-700 mb-3">⚖️ Neraca</h4>
            <div className="space-y-2">
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Total Aset</span>
                <span className="font-bold text-blue-600">{formatRupiah(aset)}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Total Kewajiban</span>
                <span className="font-bold text-orange-600">{formatRupiah(kewajiban)}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Total Ekuitas</span>
                <span className="font-bold text-purple-600">{formatRupiah(ekuitas)}</span>
              </div>
              <div className="flex justify-between py-2 font-bold text-lg border-t-2">
                <span>Aset = Kewajiban + Ekuitas</span>
                <span className={aset === (kewajiban + ekuitas) ? 'text-emerald-600' : 'text-red-600'}>
                  {aset === (kewajiban + ekuitas) ? '✅ Balance' : '❌ Tidak Balance'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ===== RENDER =====
  return (
    <div className="flex h-[calc(100vh-52px)] bg-gray-50 text-gray-900 font-sans">
      
      {/* ===== SIDEBAR ===== */}
      <div className="w-64 bg-emerald-700 text-white p-4 flex flex-col flex-shrink-0">
        <div className="mb-8">
          {logoUrl && (
            <img src={logoUrl} alt="Logo" className="w-12 h-12 rounded-full mb-2" />
          )}
          <h1 className="text-xl font-bold">{shopName}</h1>
          <p className="text-xs text-emerald-200">Buku Besar</p>
        </div>
        
        <nav className="flex-1 space-y-2">
          <Link href="/kasir">
            <button className="w-full hover:bg-emerald-600 px-4 py-2.5 rounded-lg flex items-center gap-3 transition">
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
          <Link href="/bukubesar">
            <button className="w-full bg-emerald-600 text-white px-4 py-2.5 rounded-lg flex items-center gap-3">
              <BookOpen className="w-5 h-5" /> Buku Besar
            </button>
          </Link>
          <Link href="/laporan">
            <button className="w-full hover:bg-emerald-600 px-4 py-2.5 rounded-lg flex items-center gap-3 transition">
              <FileText className="w-5 h-5" /> Laporan
            </button>
          </Link>
        </nav>
        
        <button className="w-full hover:bg-emerald-600 px-4 py-2.5 rounded-lg flex items-center gap-3 transition mt-auto">
          <LogOut className="w-5 h-5" /> Keluar
        </button>
      </div>

      {/* ===== MAIN CONTENT ===== */}
      <div className="flex-1 flex flex-col p-6 overflow-hidden">
        
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-600 text-white p-2.5 rounded-xl shadow-md">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-emerald-800 uppercase tracking-tight">Buku Besar</h1>
              <p className="text-xs text-gray-400 font-bold">Jurnal & Buku Besar Akuntansi</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => window.print()}
              className="bg-white hover:bg-gray-100 text-gray-700 font-bold text-xs px-4 py-2 rounded-xl border shadow-sm flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" /> PRINT
            </button>
          </div>
        </div>

        {/* FILTER TANGGAL */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-bold text-gray-600">Periode:</span>
              <input 
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)} 
                className="border rounded-lg px-3 py-1.5 text-sm"
              />
              <span className="text-gray-400">→</span>
              <input 
                type="date" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)} 
                className="border rounded-lg px-3 py-1.5 text-sm"
              />
            </div>
            <div className="text-sm text-gray-500">
              {filteredJurnal.length} entri jurnal
            </div>
          </div>
        </div>

        {/* TAB NAVIGATION */}
        <div className="flex flex-wrap gap-2 mb-6 bg-white p-2 rounded-2xl shadow-sm border border-gray-200">
          <button
            onClick={() => setActiveTab('jurnal')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition ${
              activeTab === 'jurnal' 
                ? 'bg-emerald-600 text-white' 
                : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            <BookOpen className="w-4 h-4 inline mr-1" /> Jurnal Umum
          </button>
          <button
            onClick={() => setActiveTab('bukuBesar')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition ${
              activeTab === 'bukuBesar' 
                ? 'bg-emerald-600 text-white' 
                : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            <FileText className="w-4 h-4 inline mr-1" /> Buku Besar
          </button>
          <button
            onClick={() => setActiveTab('neracaSaldo')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition ${
              activeTab === 'neracaSaldo' 
                ? 'bg-emerald-600 text-white' 
                : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            <DollarSign className="w-4 h-4 inline mr-1" /> Neraca Saldo
          </button>
          <button
            onClick={() => setActiveTab('laporan')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition ${
              activeTab === 'laporan' 
                ? 'bg-emerald-600 text-white' 
                : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            <TrendingUp className="w-4 h-4 inline mr-1" /> Laporan Keuangan
          </button>
        </div>

        {/* KONTEN TAB */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'jurnal' && renderJurnal()}
          {activeTab === 'bukuBesar' && renderBukuBesar()}
          {activeTab === 'neracaSaldo' && renderNeracaSaldo()}
          {activeTab === 'laporan' && renderLaporan()}
        </div>

      </div>
    </div>
  );
}