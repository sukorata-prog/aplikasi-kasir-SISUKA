"use client";

import React, { useState, useEffect } from 'react';
import { dbLocal, User } from '@/lib/dbLocal';
import { UserIcon, Plus, Trash2, Edit, Save, X, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function KasirManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<User>>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    shift: 'Pagi' as 'Pagi' | 'Siang' | 'Malam',
    pin: '',
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    const data = await dbLocal.users.toArray();
    setUsers(data);
  };

  const handleEdit = (user: User) => {
    setEditingId(user.id);
    setEditData({ name: user.name, shift: user.shift, pin: user.pin });
  };

  const handleSaveEdit = async (id: string) => {
    if (!editData.name || !editData.pin) {
      alert('Nama dan PIN wajib diisi!');
      return;
    }
    await dbLocal.users.update(id, editData);
    setEditingId(null);
    loadUsers();
    alert('✅ Data kasir berhasil diupdate!');
  };

  const handleDelete = async (id: string) => {
    if (confirm('Hapus kasir ini?')) {
      await dbLocal.users.delete(id);
      loadUsers();
      alert('✅ Kasir berhasil dihapus!');
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.name || !newUser.pin) {
      alert('Nama dan PIN wajib diisi!');
      return;
    }
    if (newUser.pin.length !== 4) {
      alert('PIN harus 4 digit!');
      return;
    }
    await dbLocal.users.add({
      id: `KSR-${Date.now().toString().slice(-6)}`,
      name: newUser.name,
      role: 'KASIR',
      shift: newUser.shift,
      pin: newUser.pin,
      isActive: true,
      createdAt: Date.now()
    });
    setNewUser({ name: '', shift: 'Pagi', pin: '' });
    setShowAddForm(false);
    loadUsers();
    alert('✅ Kasir baru berhasil ditambahkan!');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-black text-emerald-800">👤 Manajemen Kasir</h1>
            <p className="text-sm text-gray-400">Tambah, edit, atau hapus data kasir dengan mudah</p>
          </div>
          <div className="flex gap-2">
            <Link href="/kasir">
              <button className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-xs px-4 py-2 rounded-lg flex items-center gap-1">
                <ArrowLeft className="w-4 h-4" /> Kembali
              </button>
            </Link>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-lg flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> Tambah Kasir
            </button>
          </div>
        </div>

        {showAddForm && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mb-6">
            <h3 className="font-bold text-gray-800 mb-3">📝 Tambah Kasir Baru</h3>
            <form onSubmit={handleAddUser} className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Nama Kasir</label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  placeholder="Contoh: Joko"
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Shift</label>
                <select
                  value={newUser.shift}
                  onChange={(e) => setNewUser({ ...newUser, shift: e.target.value as any })}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                >
                  <option value="Pagi">🌅 Pagi</option>
                  <option value="Siang">☀️ Siang</option>
                  <option value="Malam">🌙 Malam</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">PIN (4 digit)</label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={newUser.pin}
                    onChange={(e) => setNewUser({ ...newUser, pin: e.target.value })}
                    placeholder="••••"
                    maxLength={4}
                    className="flex-1 border rounded-lg px-3 py-2 text-sm text-center font-bold tracking-widest"
                    required
                  />
                  <button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-lg text-sm"
                  >
                    Simpan
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold px-4 py-2 rounded-lg text-sm"
                  >
                    Batal
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 font-bold text-gray-500">Nama</th>
                <th className="text-left px-4 py-3 font-bold text-gray-500">Shift</th>
                <th className="text-left px-4 py-3 font-bold text-gray-500">PIN</th>
                <th className="text-center px-4 py-3 font-bold text-gray-500">Status</th>
                <th className="text-center px-4 py-3 font-bold text-gray-500">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {users.filter(u => u.role === 'KASIR').map((user) => (
                <tr key={user.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3">
                    {editingId === user.id ? (
                      <input
                        type="text"
                        value={editData.name || ''}
                        onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                        className="border rounded-lg px-2 py-1 text-sm w-full"
                      />
                    ) : (
                      <span className="font-medium text-gray-800">{user.name}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {editingId === user.id ? (
                      <select
                        value={editData.shift || 'Pagi'}
                        onChange={(e) => setEditData({ ...editData, shift: e.target.value as any })}
                        className="border rounded-lg px-2 py-1 text-sm"
                      >
                        <option value="Pagi">🌅 Pagi</option>
                        <option value="Siang">☀️ Siang</option>
                        <option value="Malam">🌙 Malam</option>
                      </select>
                    ) : (
                      <span className="text-sm text-gray-600">{user.shift}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {editingId === user.id ? (
                      <input
                        type="password"
                        value={editData.pin || ''}
                        onChange={(e) => setEditData({ ...editData, pin: e.target.value })}
                        maxLength={4}
                        className="border rounded-lg px-2 py-1 text-sm w-20 text-center font-bold tracking-widest"
                      />
                    ) : (
                      <span className="font-mono text-sm text-gray-600">{user.pin}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs px-2 py-1 rounded-full ${user.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                      {user.isActive ? '✅ Aktif' : '❌ Nonaktif'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {editingId === user.id ? (
                      <div className="flex justify-center gap-1">
                        <button
                          onClick={() => handleSaveEdit(user.id)}
                          className="text-emerald-600 hover:text-emerald-800"
                          title="Simpan"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="text-gray-400 hover:text-gray-600"
                          title="Batal"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-center gap-1">
                        <button
                          onClick={() => handleEdit(user)}
                          className="text-blue-500 hover:text-blue-700"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="text-red-500 hover:text-red-700"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.filter(u => u.role === 'KASIR').length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <UserIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>Belum ada data kasir</p>
            </div>
          )}
        </div>

        <div className="mt-4 text-center text-[10px] text-gray-400">
          <p>💡 Kasir yang sudah dihapus tidak bisa login lagi.</p>
          <p>🔑 Pastikan PIN 4 digit dan mudah diingat oleh kasir.</p>
        </div>
      </div>
    </div>
  );
}