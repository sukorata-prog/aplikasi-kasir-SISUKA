"use client";

import React, { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ShoppingBag, Package, LayoutDashboard, LogOut, Lock, ShieldAlert } from "lucide-react";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  
  // State untuk pengunci PIN keamanan saat pindah halaman
  const [showPinModal, setShowPinModal] = useState(false);
  const [targetRoute, setTargetRoute] = useState("");
  const [pinInput, setPinInput] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const PIN_RAHASIA_OWNER = "1234"; // Sesuai PIN pengunci gerbang utama

  // Jangan munculkan navbar jika pengguna berada di halaman gerbang paling depan "/"
  const isHomePage = pathname === "/";

  const handleNavClick = (route: string) => {
    if (route === "/kasir" || route === "/") {
      // Kasir atau Keluar bisa langsung diklik tanpa password
      router.push(route);
    } else {
      // Jika dari kasir mau loncat ke stok/dashboard, wajib verifikasi PIN Owner
      setTargetRoute(route);
      setShowPinModal(true);
      setPinInput("");
      setErrorMsg("");
    }
  };

  const handleVerifyPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === PIN_RAHASIA_OWNER) {
      setShowPinModal(false);
      router.push(targetRoute);
    } else {
      setErrorMsg("PIN Salah! Hanya Owner yang diberikan izin.");
      setPinInput("");
    }
  };

  return (
    <html lang="id">
      <body className="bg-gray-50 text-gray-900 font-sans antialiased">
        
        {/* BILAH NAVIGASI UTAMA (Otomatis Sembunyi saat Cetak/Print Struk) */}
        {!isHomePage && (
          <nav className="bg-emerald-900 text-white px-6 py-3 flex items-center justify-between shadow-md sticky top-0 z-40 print:hidden">
            {/* Nama Merek Toko Aktif */}
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => handleNavClick("/")}>
              <div className="bg-emerald-500 p-1.5 rounded-lg text-white font-black text-xs">AA</div>
              <span className="font-black text-sm tracking-wider uppercase">ANI AGRO SYSTEM</span>
            </div>

            {/* Jajaran Tombol Loncat Halaman */}
            <div className="flex items-center gap-2 text-xs font-bold">
              <button 
                onClick={() => handleNavClick("/kasir")}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition ${pathname === "/kasir" ? "bg-emerald-700 text-white shadow-inner border border-emerald-500" : "hover:bg-emerald-800 text-emerald-100"}`}
              >
                <ShoppingBag className="w-3.5 h-3.5" /> KASIR JUALAN
              </button>

              <button 
                onClick={() => handleNavClick("/stok")}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition ${pathname === "/stok" ? "bg-emerald-700 text-white shadow-inner border border-emerald-500" : "hover:bg-emerald-800 text-emerald-100"}`}
              >
                <Package className="w-3.5 h-3.5" /> STOK GUDANG
              </button>

              <button 
                onClick={() => handleNavClick("/dashboard")}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition ${pathname === "/dashboard" ? "bg-emerald-700 text-white shadow-inner border border-emerald-500" : "hover:bg-emerald-800 text-emerald-100"}`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" /> DASHBOARD OWNER
              </button>
            </div>

            {/* Tombol Keluar Kembali Ke Pintu Depan */}
            <button 
              onClick={() => handleNavClick("/")}
              className="flex items-center gap-1 text-xs font-bold bg-red-600/20 hover:bg-red-600 text-red-200 hover:text-white px-3 py-1.5 rounded-xl transition border border-red-500/30"
            >
              <LogOut className="w-3.5 h-3.5" /> KELUAR
            </button>
          </nav>
        )}

        {/* Konten Halaman Utama Aplikasi */}
        <main className="w-full">
          {children}
        </main>

        {/* MODAL PENGUNCI PIN SAKTI ANTAR HALAMAN */}
        {showPinModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 border border-gray-700 p-6 rounded-2xl shadow-2xl w-80 text-center text-white font-sans">
              <div className="bg-amber-500/10 text-amber-400 w-11 h-11 rounded-full flex items-center justify-center mx-auto mb-3">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base mb-1">Verifikasi PIN Keamanan</h3>
              <p className="text-[11px] text-gray-400 mb-4">Halaman terlindungi. Masukkan PIN Anda selaku Owner.</p>
              
              <form onSubmit={handleVerifyPin} className="space-y-3">
                <input 
                  type="password" 
                  maxLength={4}
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="• • • •" 
                  className="w-full bg-gray-900 border border-gray-700 py-2.5 rounded-xl text-center text-2xl font-bold tracking-widest text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder-gray-600"
                  autoFocus
                />
                {errorMsg && <p className="text-[11px] text-red-400 font-semibold">{errorMsg}</p>}
                
                <div className="flex gap-2 pt-2 text-xs font-bold">
                  <button type="button" onClick={() => setShowPinModal(false)} className="flex-1 bg-gray-700 hover:bg-gray-600 py-2 rounded-lg transition">
                    BATAL
                  </button>
                  <button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-500 py-2 rounded-lg transition">
                    MASUK
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </body>
    </html>
  );
}
