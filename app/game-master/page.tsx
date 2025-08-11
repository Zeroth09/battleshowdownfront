'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Zap,
  Play,
  Square,
  Clock,
  Users,
  Trophy
} from 'lucide-react';
import SocketManager, { SocketManagerRef } from '../../components/SocketManager';

export default function GameMasterPage() {
  const [statusGame, setStatusGame] = useState<'idle' | 'playing'>('idle');
  const [isConnected, setIsConnected] = useState(false);
  const [waktuTersisa, setWaktuTersisa] = useState(30);
  const [jumlahPemain, setJumlahPemain] = useState(0);
  const [skorTertinggi, setSkorTertinggi] = useState(0);
  
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
  };

  const handleBattleStart = (battleData: any) => {
    console.log('⚔️ Battle started:', battleData);
    setStatusGame('playing');
    setWaktuTersisa(30);
  };

  const handleBattleEnd = (result: any) => {
    console.log('🏁 Battle ended:', result);
    setStatusGame('idle');
    setWaktuTersisa(30);
    
    // Update stats
    if (result.pemenang) {
      setSkorTertinggi(Math.max(skorTertinggi, result.pemenang.skor || 0));
    }
  };

  const handleStartGame = async () => {
    if (!socketRef.current || !isConnected) {
      alert('Socket belum terhubung!');
      return;
    }

    try {
      // Trigger global game start via socket
      const gameData = {
        gameData: {
          id: `game_${Date.now()}`,
          mode: 'global-battle',
          waktu: 30,
          pertanyaan: 'Pertanyaan akan dikirim otomatis dari sistem'
        },
        gameMasterId: gameMasterUser.pemainId
      };

      // Emit event untuk trigger game start
      socketRef.current.socket?.emit('game-master-start-game', gameData);
      
      console.log('🎯 Game Master memulai game:', gameData);
      setStatusGame('playing');
      
    } catch (error) {
      console.error('Error starting game:', error);
      alert('Gagal memulai game!');
    }
  };

  const handleStopGame = async () => {
    if (!socketRef.current) return;

    try {
      // End game via socket
      socketRef.current.socket?.emit('game-master-stop-game', {
        result: { message: 'Game dihentikan oleh Game Master' },
        gameMasterId: gameMasterUser.pemainId
      });

      setStatusGame('idle');
      setWaktuTersisa(30);
    } catch (error) {
      console.error('Error stopping game:', error);
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

  // Simulate player count updates
  useEffect(() => {
    if (isConnected) {
      const interval = setInterval(() => {
        setJumlahPemain(Math.floor(Math.random() * 20) + 5); // Random 5-25 players
      }, 3000);
      
      return () => clearInterval(interval);
    }
  }, [isConnected]);

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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Game Master Control Panel</h1>
            <p className="text-gray-600">Kontrol game dan monitor status peserta</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Main Control Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-2xl p-8 border border-red-100 mb-8"
          >
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Kontrol Game
              </h2>
              
              <div className="flex items-center justify-center space-x-6 mb-8">
                {/* Game Status */}
                <div className="text-center">
                  <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-3 ${
                    statusGame === 'playing' ? 'bg-red-100' : 'bg-gray-100'
                  }`}>
                    {statusGame === 'playing' ? (
                      <Play className="w-10 h-10 text-red-600" />
                    ) : (
                      <Square className="w-10 h-10 text-gray-400" />
                    )}
                  </div>
                  <p className={`font-semibold ${
                    statusGame === 'playing' ? 'text-red-600' : 'text-gray-500'
                  }`}>
                    {statusGame === 'playing' ? 'Game Sedang Berjalan' : 'Game Belum Dimulai'}
                  </p>
                </div>

                {/* Timer */}
                <div className="text-center">
                  <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <Clock className="w-10 h-10 text-blue-600" />
                  </div>
                  <div className="text-3xl font-bold text-blue-600">
                    {waktuTersisa}s
                  </div>
                  <p className="text-sm text-gray-500">Waktu Tersisa</p>
                </div>
              </div>
              
              {/* Main Action Buttons */}
              <div className="flex items-center justify-center space-x-6">
                {statusGame === 'idle' ? (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleStartGame}
                    disabled={!isConnected}
                    className={`px-12 py-6 rounded-2xl font-bold text-xl transition-all duration-200 ${
                      !isConnected
                        ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                        : 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 shadow-xl'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Play className="w-6 h-6" />
                      <span>Mulai Game!</span>
                    </div>
                  </motion.button>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleStopGame}
                    className="px-12 py-6 bg-red-500 text-white rounded-2xl font-bold text-xl hover:bg-red-600 transition-colors shadow-xl"
                  >
                    <div className="flex items-center space-x-3">
                      <Square className="w-6 h-6" />
                      <span>Stop Game!</span>
                    </div>
                  </motion.button>
                )}
              </div>
              
              <p className="text-sm text-gray-500 mt-4">
                {statusGame === 'idle' 
                  ? 'Klik untuk memulai game global dengan pertanyaan otomatis'
                  : 'Klik untuk menghentikan game'
                }
              </p>
            </div>
          </motion.div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
                  ? 'Socket terhubung, siap mengontrol game'
                  : 'Menunggu koneksi socket...'
                }
              </p>
            </motion.div>

            {/* Player Count */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl shadow-lg p-6 border border-red-100"
            >
              <div className="flex items-center space-x-3 mb-4">
                <Users className="w-6 h-6 text-blue-600" />
                <h3 className="font-semibold text-gray-900">Peserta Aktif</h3>
              </div>
              
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {jumlahPemain}
              </div>
              
              <p className="text-xs text-gray-500">
                Peserta yang sedang online
              </p>
            </motion.div>

            {/* High Score */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl shadow-lg p-6 border border-red-100"
            >
              <div className="flex items-center space-x-3 mb-4">
                <Trophy className="w-6 h-6 text-yellow-600" />
                <h3 className="font-semibold text-gray-900">Skor Tertinggi</h3>
              </div>
              
              <div className="text-3xl font-bold text-yellow-600 mb-2">
                {skorTertinggi}
              </div>
              
              <p className="text-xs text-gray-500">
                Skor tertinggi peserta
              </p>
            </motion.div>

            {/* Game Mode */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-2xl shadow-lg p-6 border border-red-100"
            >
              <div className="flex items-center space-x-3 mb-4">
                <Play className="w-6 h-6 text-purple-600" />
                <h3 className="font-semibold text-gray-900">Mode Game</h3>
              </div>
              
              <div className="text-lg font-semibold text-purple-600 mb-2">
                Global Battle
              </div>
              
              <p className="text-xs text-gray-500">
                Semua peserta vs sistem
              </p>
            </motion.div>
          </div>

          {/* Info Panel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-gradient-to-r from-red-50 to-red-100 rounded-2xl p-6 border border-red-200"
          >
            <h3 className="font-semibold text-red-900 mb-4 text-lg">📋 Cara Kerja Game Master</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-red-800">
              <div>
                <p className="mb-2">1. <strong>Monitor Status</strong> - Lihat koneksi socket dan jumlah peserta</p>
                <p className="mb-2">2. <strong>Mulai Game</strong> - Klik tombol hijau untuk memulai game global</p>
              </div>
              <div>
                <p className="mb-2">3. <strong>Monitor Game</strong> - Lihat waktu tersisa dan status game</p>
                <p className="mb-2">4. <strong>Stop Game</strong> - Klik tombol merah untuk menghentikan game</p>
              </div>
            </div>
            <div className="mt-4 p-3 bg-red-200 rounded-lg">
              <p className="text-sm text-red-800">
                <strong>Note:</strong> Game Master hanya mengontrol mulai/stop game. Pertanyaan dan gameplay diatur otomatis oleh sistem.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
} 