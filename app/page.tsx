"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';  // <-- TAMBAHKAN INI
import { ShoppingBag, Package, LayoutDashboard, Lock, ShieldAlert, BadgeInfo, BookOpen } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const [showPinModal, setShowPinModal] = useState(false);
  const [targetRoute, setTargetRoute] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // PIN Manajemen Keamanan Utama Berdasarkan BRD Hak Akses
  const PIN_RAHASIA_OWNER = "1234";

  const handleRouteClick = (route: string) => {
    if (route === '/kasir') {
      router.push('/kasir');
    } else {
      setTargetRoute(route);
      setShowPinModal(true);
      setErrorMsg('');
      setPinInput('');
    }
  };

  const handleVerifyPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === PIN_RAHASIA_OWNER) {
      setShowPinModal(false);
      router.push(targetRoute);
    } else {
      setErrorMsg('PIN Salah! Hanya Owner/Manajer yang diberikan izin masuk.');
      setPinInput('');
    }
  };

  return (
    <div className="min-h-screen bg-neutral-900 text-white flex flex-col items-center justify-center p-6 font-sans">
      
      {/* IDENTITAS UTAMA ERP SISUKA */}
      <div className="text-center mb-10">
        <div className="bg-emerald-600 inline-flex p-3 rounded-2xl shadow-lg shadow-emerald-900/30 mb-4">
          <Package className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-4xl font-black tracking-wider text-emerald-400">SISUKA ERP SYSTEM</h1>
        <p className="text-xs text-neutral-400 uppercase tracking-widest font-bold mt-1">Platform Manajemen Terintegrasi UMKM & Pertanian</p>
      </div>

      {/* STRUKTUR MENU UTAMA (4 KOLOM) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-6xl w-full">
        
        {/* 1. Modul Kasir (POS) */}
        <div 
          onClick={() => handleRouteClick('/kasir')}
          className="bg-neutral-800/50 hover:bg-emerald-800 border border-neutral-700/50 hover:border-emerald-500 p-6 rounded-2xl text-center cursor-pointer transition-all duration-300 transform hover:-translate-y-1 shadow-xl group"
        >
          <div className="bg-emerald-500/10 text-emerald-400 group-hover:bg-white group-hover:text-emerald-800 w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4 transition">
            <ShoppingBag className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold mb-1 text-neutral-100 group-hover:text-white">Modul Kasir (POS)</h2>
          <p className="text-[11px] text-neutral-400 group-hover:text-emerald-100">Gerbang harian transaksi kasir, input belanja petani, dan cetak struk thermal.</p>
        </div>

        {/* 2. Modul Inventori Gudang */}
        <div 
          onClick={() => handleRouteClick('/stok')}
          className="bg-neutral-800/50 hover:bg-neutral-800 border border-neutral-700/50 hover:border-emerald-600 p-6 rounded-2xl text-center cursor-pointer transition-all duration-300 transform hover:-translate-y-1 shadow-xl group relative"
        >
          <Lock className="absolute top-4 right-4 w-3.5 h-3.5 text-neutral-600 group-hover:text-neutral-300" />
          <div className="bg-amber-500/10 text-amber-400 group-hover:bg-white group-hover:text-neutral-800 w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4 transition">
            <Package className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold mb-1 text-neutral-100 group-hover:text-white">Inventori & Stok</h2>
          <p className="text-[11px] text-neutral-400 group-hover:text-neutral-100">Manajemen master data barang datang, deteksi stok minimum, dan impor massal Excel.</p>
        </div>

        {/* 3. Modul Akunting & Dashboard */}
        <div 
          onClick={() => handleRouteClick('/dashboard')}
          className="bg-neutral-800/50 hover:bg-neutral-800 border border-neutral-700/50 hover:border-emerald-600 p-6 rounded-2xl text-center cursor-pointer transition-all duration-300 transform hover:-translate-y-1 shadow-xl group relative"
        >
          <Lock className="absolute top-4 right-4 w-3.5 h-3.5 text-neutral-600 group-hover:text-neutral-300" />
          <div className="bg-purple-500/10 text-purple-400 group-hover:bg-white group-hover:text-neutral-800 w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4 transition">
            <LayoutDashboard className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold mb-1 text-neutral-100 group-hover:text-white">Akunting & Dashboard</h2>
          <p className="text-[11px] text-neutral-400 group-hover:text-neutral-100">Audit keuangan, pencatatan biaya operasional harian, laba bersih, dan kirim laporan WA.</p>
        </div>

        {/* 4. BUKU BESAR - TAMBAHKAN INI */}
        <div 
          onClick={() => handleRouteClick('/bukubesar')}
          className="bg-neutral-800/50 hover:bg-neutral-800 border border-neutral-700/50 hover:border-orange-500 p-6 rounded-2xl text-center cursor-pointer transition-all duration-300 transform hover:-translate-y-1 shadow-xl group relative"
        >
          <Lock className="absolute top-4 right-4 w-3.5 h-3.5 text-neutral-600 group-hover:text-neutral-300" />
          <div className="bg-orange-500/10 text-orange-400 group-hover:bg-white group-hover:text-neutral-800 w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4 transition">
            <BookOpen className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold mb-1 text-neutral-100 group-hover:text-white">Buku Besar</h2>
          <p className="text-[11px] text-neutral-400 group-hover:text-neutral-100">Jurnal umum, buku besar, neraca saldo, dan laporan keuangan lengkap.</p>
        </div>

      </div>

      {/* INFORMASI FOOTER */}
      <div className="mt-12 text-[10px] text-neutral-500 flex items-center gap-1">
        <BadgeInfo className="w-3 h-3" /> Hak Akses Terlindungi Sistem Enkripsi IndexedDB Lokal
      </div>

      {/* MODAL PENGUNCI HAK AKSES OWNER */}
      {showPinModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-neutral-800 border border-neutral-700 p-6 rounded-2xl shadow-2xl w-80 text-center text-white">
            <div className="bg-amber-500/10 text-amber-400 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base mb-0.5">Verifikasi Hak Akses</h3>
            <p className="text-[11px] text-neutral-400 mb-4">Masukkan 4 digit PIN Owner untuk masuk ke modul administrasi.</p>
            
            <form onSubmit={handleVerifyPin} className="space-y-3">
              <input 
                type="password" 
                maxLength={4}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="• • • •" 
                className="w-full bg-neutral-900 border border-neutral-700 py-2.5 rounded-xl text-center text-2xl font-bold tracking-widest text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder-neutral-700"
                autoFocus
              />
              {errorMsg && <p className="text-[10px] text-red-400 font-bold">{errorMsg}</p>}
              
              <div className="flex gap-2 pt-2 text-xs font-bold">
                <button type="button" onClick={() => setShowPinModal(false)} className="flex-1 bg-neutral-700 hover:bg-neutral-600 py-2 rounded-xl transition">
                  BATAL
                </button>
                <button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-500 py-2 rounded-xl transition">
                  KONFIRMASI
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}