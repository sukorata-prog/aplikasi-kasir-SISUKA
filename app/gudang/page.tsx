"use client";

import React, { useState, useEffect } from 'react';
import { dbLocal, LocalProduct } from '@/lib/dbLocal';
import { Package, Plus, Trash2 } from 'lucide-react';

export default function GudangPage() {
  const [products, setProducts] = useState<LocalProduct[]>([]);
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [units, setUnits] = useState('Sak');
  const [stock, setStock] = useState(0);
  const [price, setPrice] = useState(0);
  const [isSeasonal, setIsSeasonal] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    const data = await dbLocal.products.toArray();
    setProducts(data);
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !sku) return alert('Nama dan SKU wajib diisi!');

    const id = Date.now().toString();
    await dbLocal.products.add({
      id, name, sku, units, stock, price, is_seasonal: isSeasonal
    });

    // Reset Form Input Utama
    setName(''); setSku(''); setStock(0); setPrice(0); setIsSeasonal(false);
    loadProducts();
    alert('Produk baru berhasil ditambahkan ke database lokal!');
  };

  const handleDelete = async (id: string) => {
    if (confirm('Hapus produk ini dari gudang?')) {
      await dbLocal.products.delete(id);
      loadProducts();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-6 font-sans">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Form Tambah Barang */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm h-fit">
          <h2 className="text-xl font-bold text-emerald-700 flex items-center gap-2 mb-4">
            <Plus className="w-5 h-5" /> Tambah Stok Gudang
          </h2>
          <form onSubmit={handleAddProduct} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">KODE SKU</label>
              <input type="text" value={sku} onChange={(e) => setSku(e.target.value)} placeholder="Contoh: PRD-005" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm bg-white" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">NAMA BARANG</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama pupuk / obat / benih" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm bg-white" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">SATUAN</label>
                <select value={units} onChange={(e) => setUnits(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm bg-white">
                  <option value="Sak">Sak (50kg)</option>
                  <option value="Pack">Pack</option>
                  <option value="Botol">Botol</option>
                  <option value="Kg">Kilogram</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">JUMLAH STOK</label>
                <input type="number" value={stock} onChange={(e) => setStock(Number(e.target.value))} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm bg-white" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">HARGA JUAL (RP)</label>
              <input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm bg-white" />
            </div>
            <div className="flex items-center gap-2 pt-2">
              <input type="checkbox" id="seasonal" checked={isSeasonal} onChange={(e) => setIsSeasonal(e.target.checked)} className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded" />
              <label htmlFor="seasonal" className="text-sm font-medium text-gray-700">Ini Barang Musiman Pertanian</label>
            </div>
            <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl transition shadow-md mt-2 text-sm">
              SIMPAN KE GUDANG
            </button>
          </form>
        </div>

        {/* Tabel Informasi Stok Terkini */}
        <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-4">
            <Package className="text-emerald-600" /> Daftar Manajemen Stok Fisik
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-700 uppercase text-xs font-semibold border-b">
                <tr>
                  <th className="py-3 px-4">SKU / Nama</th>
                  <th className="py-3 px-4">Stok</th>
                  <th className="py-3 px-4">Harga</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="font-mono text-xs text-gray-400">{product.sku}</div>
                      <div className="font-semibold text-gray-800 flex items-center gap-1.5">
                        {product.name}
                        {product.is_seasonal && <span className="text-[9px] bg-amber-100 text-amber-800 px-1 rounded">Musiman</span>}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-medium">{product.stock} {product.units}</td>
                    <td className="py-3 px-4 font-bold text-emerald-600">Rp {product.price.toLocaleString('id-ID')}</td>
                    <td className="py-3 px-4 text-center">
                      <button onClick={() => handleDelete(product.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
