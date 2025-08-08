'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Crown, Users, Settings, ArrowLeft } from 'lucide-react';

interface User {
  pemainId: string;
  nama: string;
  tim: 'merah' | 'putih';
}

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [gameMasterId, setGameMasterId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load existing users from localStorage
    const loadUsers = () => {
      const userData = localStorage.getItem('user');
      if (userData) {
        try {
          const user = JSON.parse(userData);
          setUsers([user]);
        } catch (error) {
          console.error('Error loading user:', error);
        }
      }
      setIsLoading(false);
    };

    loadUsers();
  }, []);

  const handleSetGameMaster = (userId: string) => {
    setGameMasterId(userId);
    localStorage.setItem('gameMasterId', userId);
    
    // Show success message
    alert('Game Master berhasil diset!');
  };

  const handleClearGameMaster = () => {
    setGameMasterId('');
    localStorage.removeItem('gameMasterId');
    
    // Show success message
    alert('Game Master berhasil dihapus!');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading Admin Page...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 text-white">
      {/* Header */}
      <div className="bg-black/30 backdrop-blur-sm border-b border-white/20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Crown className="w-8 h-8 text-yellow-400" />
              <div>
                <h1 className="text-xl font-bold">Admin Panel</h1>
                <p className="text-sm text-gray-300">Game Master Setup</p>
              </div>
            </div>
            <a
              href="/event"
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Event</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Game Master Status */}
        <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-white/20">
          <div className="flex items-center gap-3 mb-4">
            <Crown className="w-6 h-6 text-yellow-400" />
            <h2 className="text-lg font-bold">Status Game Master</h2>
          </div>
          
          {gameMasterId ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Crown className="w-8 h-8 text-white" />
              </div>
              <p className="text-green-400 font-bold mb-2">Game Master Aktif</p>
              <p className="text-gray-300 text-sm mb-4">
                ID: {gameMasterId}
              </p>
              <button
                onClick={handleClearGameMaster}
                className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-all"
              >
                Hapus Game Master
              </button>
            </div>
          ) : (
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Crown className="w-8 h-8 text-white" />
              </div>
              <p className="text-gray-400 font-bold mb-2">Game Master Belum Diset</p>
              <p className="text-gray-300 text-sm">
                Pilih user di bawah untuk menjadi Game Master
              </p>
            </div>
          )}
        </div>

        {/* Users List */}
        <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
          <div className="flex items-center gap-3 mb-6">
            <Users className="w-6 h-6 text-blue-400" />
            <h2 className="text-lg font-bold">Daftar User</h2>
          </div>
          
          {users.length > 0 ? (
            <div className="space-y-4">
              {users.map((user) => (
                <motion.div
                  key={user.pemainId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/10 rounded-lg p-4 border border-white/20"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full ${user.tim === 'merah' ? 'bg-red-500' : 'bg-white'}`}></div>
                      <div>
                        <p className="font-bold">{user.nama}</p>
                        <p className="text-sm text-gray-300">Tim {user.tim.toUpperCase()}</p>
                        <p className="text-xs text-gray-400">ID: {user.pemainId}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {gameMasterId === user.pemainId ? (
                        <div className="flex items-center gap-2 text-yellow-400">
                          <Crown className="w-4 h-4" />
                          <span className="text-sm">Game Master</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleSetGameMaster(user.pemainId)}
                          className="bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded-lg text-sm transition-all"
                        >
                          Set Game Master
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400">Belum ada user</p>
              <p className="text-sm text-gray-500 mt-1">
                User akan muncul setelah bergabung dengan event
              </p>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-6 mt-6 border border-white/20">
          <div className="flex items-center gap-3 mb-4">
            <Settings className="w-6 h-6 text-green-400" />
            <h2 className="text-lg font-bold">Cara Kerja</h2>
          </div>
          
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold mt-0.5">
                1
              </div>
              <div>
                <p className="font-semibold">Set Game Master</p>
                <p className="text-gray-300">Pilih user yang akan menjadi Game Master</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold mt-0.5">
                2
              </div>
              <div>
                <p className="font-semibold">Game Master Controls</p>
                <p className="text-gray-300">Game Master dapat trigger battle dan kontrol hasil</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold mt-0.5">
                3
              </div>
              <div>
                <p className="font-semibold">Peserta Menunggu</p>
                <p className="text-gray-300">Peserta lain hanya menunggu dan menjawab</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 