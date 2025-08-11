'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Zap,
  Send,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Play,
  Square
} from 'lucide-react';
import SocketManager, { SocketManagerRef } from '../../components/SocketManager';

interface Pertanyaan {
  _id: string;
  pertanyaan: string;
  pilihanJawaban: {
    a: string;
    b: string;
    c: string;
    d: string;
  };
  jawabanBenar: string;
  kategori: string;
  tingkatKesulitan: string;
}

export default function GameMasterPage() {
  const [pertanyaanAktif, setPertanyaanAktif] = useState<Pertanyaan | null>(null);
  const [statusGame, setStatusGame] = useState<'idle' | 'playing'>('idle');
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [waktuTersisa, setWaktuTersisa] = useState(30);
  
  const socketRef = useRef<SocketManagerRef>(null);

  // Mock user data untuk game master
  const gameMasterUser = {
    pemainId: 'game-master-001',
    nama: 'Game Master',
    tim: 'merah' as const
  };

  const handleReady = () => {
    console.log('✅ Socket ready for Game Master');
    setIsConnected(true);
    getPertanyaanRandom();
  };

  const handleBattleStart = (battleData: any) => {
    console.log('⚔️ Battle started:', battleData);
    setStatusGame('playing');
    setWaktuTersisa(30);
  };

  const handleBattleEnd = (result: any) => {
    console.log('🏁 Battle ended:', result);
    setStatusGame('idle');
    setPertanyaanAktif(null);
    setWaktuTersisa(30);
  };

  const getPertanyaanRandom = async () => {
    try {
      setIsLoading(true);
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      const response = await fetch(`${backendUrl}/api/pertanyaan/sheets/random`);
      if (response.ok) {
        const data = await response.json();
        if (data.sukses && data.data) {
          setPertanyaanAktif(data.data);
        }
      }
    } catch (error) {
      console.error('Error getting random pertanyaan:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKirimPertanyaan = async () => {
    if (!pertanyaanAktif) {
      alert('Tidak ada pertanyaan tersedia!');
      return;
    }

    if (!socketRef.current || !isConnected) {
      alert('Socket belum terhubung!');
      return;
    }

    try {
      // Trigger global battle via socket
      const battleData = {
        battleData: {
          id: `battle_${Date.now()}`,
          pertanyaan: pertanyaanAktif.pertanyaan,
          pilihanJawaban: pertanyaanAktif.pilihanJawaban,
          jawabanBenar: pertanyaanAktif.pilihanJawaban[pertanyaanAktif.jawabanBenar as keyof typeof pertanyaanAktif.pilihanJawaban],
          lawan: {
            nama: 'Semua Peserta',
            tim: 'global'
          }
        },
        gameMasterId: gameMasterUser.pemainId
      };

      // Emit event untuk trigger battle
      socketRef.current.socket?.emit('game-master-trigger-battle', battleData);
      
      console.log('🎯 Game Master mengirim pertanyaan:', battleData);
      setStatusGame('playing');
      
    } catch (error) {
      console.error('Error sending pertanyaan:', error);
      alert('Gagal mengirim pertanyaan!');
    }
  };

  const handleStopGame = async () => {
    if (!socketRef.current) return;

    try {
      // End battle via socket
      socketRef.current.socket?.emit('game-master-end-battle', {
        result: { message: 'Battle dihentikan oleh Game Master' },
        gameMasterId: gameMasterUser.pemainId
      });

      setStatusGame('idle');
      setPertanyaanAktif(null);
      setWaktuTersisa(30);
    } catch (error) {
      console.error('Error stopping battle:', error);
    }
  };

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (statusGame === 'playing' && waktuTersisa > 0) {
      interval = setInterval(() => {
        setWaktuTersisa(prev => {
          if (prev <= 1) {
            handleStopGame();
            return 30;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [statusGame, waktuTersisa]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-100">
      {/* Socket Manager */}
      <SocketManager
        ref={socketRef}
        user={gameMasterUser}
        onReady={handleReady}
        onBattleStart={handleBattleStart}
        onBattleEnd={handleBattleEnd}
      />

      {/* Header */}
      <div className="bg-white shadow-sm border-b border-red-100">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Game Master Panel</h1>
            <p className="text-gray-600">Kontrol pertanyaan dan gameplay realtime</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Main Action Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-2xl p-8 border border-red-100 mb-8"
          >
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Kirim Pertanyaan ke Peserta
              </h2>
              
              {!pertanyaanAktif ? (
                <div className="py-12">
                  <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">Menunggu pertanyaan...</p>
                  <button
                    onClick={getPertanyaanRandom}
                    disabled={isLoading}
                    className="bg-blue-500 text-white px-6 py-3 rounded-xl hover:bg-blue-600 transition-colors disabled:bg-gray-400"
                  >
                    {isLoading ? (
                      <div className="flex items-center space-x-2">
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        <span>Memuat...</span>
                      </div>
                    ) : (
                      <span>Ambil Pertanyaan Random</span>
                    )}
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Pertanyaan Display */}
                  <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-2xl p-6 border border-red-200">
                    <h3 className="font-semibold text-gray-900 mb-4 text-lg">
                      Pertanyaan:
                    </h3>
                    <p className="text-gray-800 text-lg mb-4">
                      {pertanyaanAktif.pertanyaan}
                    </p>
                    
                    {/* Pilihan Jawaban */}
                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries(pertanyaanAktif.pilihanJawaban).map(([key, value]) => (
                        <div key={key} className="bg-white rounded-lg p-3 border-2 border-red-200">
                          <div className="flex items-center">
                            <span className="font-bold text-red-600 mr-3">{key.toUpperCase()}.</span>
                            <span className="text-gray-700">{value}</span>
                            {key === pertanyaanAktif.jawabanBenar && (
                              <CheckCircle className="w-5 h-5 text-green-600 ml-auto" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Info */}
                    <div className="flex items-center justify-center space-x-4 mt-4">
                      <span className="bg-red-200 text-red-700 px-3 py-1 rounded-full text-sm font-medium">
                        {pertanyaanAktif.kategori}
                      </span>
                      <span className="bg-blue-200 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                        {pertanyaanAktif.tingkatKesulitan}
                      </span>
                    </div>
                  </div>
                  
                  {/* Main Action Button */}
                  <div className="text-center">
                    {statusGame === 'idle' ? (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleKirimPertanyaan}
                        disabled={!isConnected}
                        className={`w-full max-w-md py-6 px-8 rounded-2xl font-bold text-xl transition-all duration-200 ${
                          !isConnected
                            ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                            : 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 shadow-xl'
                        }`}
                      >
                        <div className="flex items-center justify-center space-x-3">
                          <Send className="w-6 h-6" />
                          <span>Kirim Pertanyaan!</span>
                        </div>
                      </motion.button>
                    ) : (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleStopGame}
                        className="w-full max-w-md py-6 px-8 bg-red-500 text-white rounded-2xl font-bold text-xl hover:bg-red-600 transition-colors shadow-xl"
                      >
                        <div className="flex items-center justify-center space-x-3">
                          <Square className="w-6 h-6" />
                          <span>Stop Game</span>
                        </div>
                      </motion.button>
                    )}
                    
                    <p className="text-sm text-gray-500 mt-3">
                      {statusGame === 'idle' 
                        ? 'Klik untuk mengirim pertanyaan ke semua peserta'
                        : 'Klik untuk menghentikan game'
                      }
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Connection Status */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl shadow-lg p-6 border border-red-100"
            >
              <div className="flex items-center space-x-3 mb-4">
                <Zap className="w-6 h-6 text-red-600" />
                <h3 className="font-semibold text-gray-900">Status Koneksi</h3>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className={`w-4 h-4 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className={`text-sm font-medium ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                  {isConnected ? 'Terhubung' : 'Tidak Terhubung'}
                </span>
              </div>
              
              <p className="text-xs text-gray-500 mt-2">
                {isConnected 
                  ? 'Socket terhubung, siap mengirim pertanyaan'
                  : 'Menunggu koneksi socket...'
                }
              </p>
            </motion.div>

            {/* Game Status */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl shadow-lg p-6 border border-red-100"
            >
              <div className="flex items-center space-x-3 mb-4">
                <Play className="w-6 h-6 text-red-600" />
                <h3 className="font-semibold text-gray-900">Status Game</h3>
              </div>
              
              {statusGame === 'idle' ? (
                <div className="text-center">
                  <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Square className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-gray-500 text-sm">Game belum dimulai</p>
                </div>
              ) : (
                <div className="text-center">
                  <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Play className="w-6 h-6 text-red-600" />
                  </div>
                  <p className="text-gray-500 text-sm mb-2">Game sedang berjalan</p>
                  <div className="text-2xl font-bold text-red-600">
                    {waktuTersisa}s
                  </div>
                </div>
              )}
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl shadow-lg p-6 border border-red-100"
            >
              <div className="flex items-center space-x-3 mb-4">
                <RefreshCw className="w-6 h-6 text-red-600" />
                <h3 className="font-semibold text-gray-900">Aksi Cepat</h3>
              </div>
              
              <button
                onClick={getPertanyaanRandom}
                disabled={isLoading || statusGame === 'playing'}
                className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Memuat...' : 'Pertanyaan Baru'}
              </button>
              
              <p className="text-xs text-gray-500 mt-2">
                Ambil pertanyaan random baru
              </p>
            </motion.div>
          </div>

          {/* Info Panel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-r from-red-50 to-red-100 rounded-2xl p-6 border border-red-200 mt-8"
          >
            <h3 className="font-semibold text-red-900 mb-4 text-lg">📋 Cara Kerja</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-red-800">
              <div>
                <p className="mb-2">1. <strong>Ambil Pertanyaan</strong> - Klik tombol untuk mendapatkan pertanyaan random</p>
                <p className="mb-2">2. <strong>Review Pertanyaan</strong> - Lihat pertanyaan dan pilihan jawaban</p>
              </div>
              <div>
                <p className="mb-2">3. <strong>Kirim Pertanyaan</strong> - Klik tombol besar untuk mengirim ke peserta</p>
                <p className="mb-2">4. <strong>Monitor Game</strong> - Lihat status dan waktu tersisa</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
} 