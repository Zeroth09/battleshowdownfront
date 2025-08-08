'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sword, Users, Target, Zap, Clock, Crown } from 'lucide-react';
import dynamic from 'next/dynamic';

const SocketManager = dynamic(() => import('../../components/SocketManager'), {
  ssr: false,
});

interface User {
  pemainId: string;
  nama: string;
  tim: 'merah' | 'putih';
  lokasi?: {
    latitude: number;
    longitude: number;
  };
}

interface Battle {
  id: string;
  pertanyaan: string;
  pilihanJawaban: {
    a: string;
    b: string;
    c: string;
    d: string;
  };
  jawabanBenar: string;
  lawan: {
    nama: string;
    tim: string;
  };
}

interface BattleResult {
  menang: boolean;
  pesan: string;
}

export default function EventPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [socketManagerReady, setSocketManagerReady] = useState(false);
  const [activeBattle, setActiveBattle] = useState<Battle | null>(null);
  const [battleResult, setBattleResult] = useState<BattleResult | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nearbyPlayers, setNearbyPlayers] = useState<any[]>([]);
  const [battleStatus, setBattleStatus] = useState<string>('Menunggu Game Master');
  const [isGameMaster, setIsGameMaster] = useState(false);

  const socketManagerRef = useRef<any>(null);

  useEffect(() => {
    // Load user data from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        console.log('👤 User loaded:', parsedUser);
        
        // Check if user is game master (you can set this in localStorage)
        const gameMasterId = localStorage.getItem('gameMasterId');
        if (gameMasterId === parsedUser.pemainId) {
          setIsGameMaster(true);
          setBattleStatus('Game Master Mode');
        }
      } catch (error) {
        console.error('❌ Error parsing user data:', error);
        setError('Error loading user data');
      }
    } else {
      setError('User data not found. Please go back to dashboard.');
    }
    setIsLoading(false);
  }, []);

  const handleSocketManagerReady = () => {
    console.log('🔌 Socket manager ready');
    setSocketManagerReady(true);
  };

  const handleBattleStart = (battleData: Battle) => {
    console.log('⚔️ Battle started:', battleData);
    setActiveBattle(battleData);
    setBattleStatus('Pertempuran Aktif!');
    setSelectedAnswer(null);
    setIsSubmitting(false);
    
    // Save to localStorage
    localStorage.setItem('currentBattle', JSON.stringify(battleData));
  };

  const handleBattleEnd = (result: any) => {
    console.log('🏁 Battle ended:', result);
    
    const battleResultData: BattleResult = {
      menang: result.menang,
      pesan: result.menang ? 'LANJUTKAN PERJALANAN!' : 'ULANGI DARI AWAL!'
    };
    
    setBattleResult(battleResultData);
    setActiveBattle(null);
    setBattleStatus('Menunggu Game Master');
    setSelectedAnswer(null);
    setIsSubmitting(false);
    
    // Clear localStorage
    localStorage.removeItem('currentBattle');
    
    // Auto-hide result after 3 seconds
    setTimeout(() => {
      setBattleResult(null);
    }, 3000);
  };

  const handleSubmitAnswer = async (answer: string) => {
    if (isSubmitting || !activeBattle) return;
    
    setIsSubmitting(true);
    setSelectedAnswer(answer);
    
    try {
      // Try multiple ways to get submitAnswer function
      let submitAnswer: any = null;
      
      if (socketManagerRef.current?.submitAnswer) {
        submitAnswer = socketManagerRef.current.submitAnswer;
      } else if ((window as any).socket?.submitAnswer) {
        submitAnswer = (window as any).socket.submitAnswer;
      }
      
      if (submitAnswer) {
        console.log('🎯 Submitting answer:', answer);
        await submitAnswer(activeBattle.id, answer);
      } else {
        console.error('❌ submitAnswer not available');
        setError('Error submitting answer. Please try again.');
      }
    } catch (error) {
      console.error('❌ Error submitting answer:', error);
      setError('Error submitting answer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNearbyPlayers = (players: any[]) => {
    setNearbyPlayers(players);
  };

  const handleBattleCancelled = () => {
    console.log('❌ Battle cancelled');
    setActiveBattle(null);
    setBattleStatus('Battle Dibatalkan - Pemain Terputus');
    localStorage.removeItem('currentBattle');
    
    setTimeout(() => {
      setBattleStatus('Menunggu Game Master');
    }, 3000);
  };

  const handleBattleError = () => {
    console.log('❌ Battle error');
    setActiveBattle(null);
    setBattleStatus('Battle Error - Battle Tidak Ditemukan');
    localStorage.removeItem('currentBattle');
    
    setTimeout(() => {
      setBattleStatus('Menunggu Game Master');
    }, 3000);
  };

  const triggerManualBattle = async () => {
    if (!user || !isGameMaster) return;
    
    setBattleStatus('Mencari Lawan...');
    
    try {
      // Simulate finding opponent
      setTimeout(() => {
        const mockBattle: Battle = {
          id: `manual_${Date.now()}`,
          pertanyaan: 'Apa ibukota Indonesia?',
          pilihanJawaban: {
            a: 'Jakarta',
            b: 'Bandung',
            c: 'Surabaya',
            d: 'Medan'
          },
          jawabanBenar: 'Jakarta',
          lawan: {
            nama: 'Lawan Manual',
            tim: user.tim === 'merah' ? 'putih' : 'merah'
          }
        };
        
        handleBattleStart(mockBattle);
      }, 2000);
      
    } catch (error) {
      console.error('❌ Error triggering manual battle:', error);
      setError('Error triggering battle');
      setBattleStatus('Menunggu Game Master');
    }
  };

  const handleManualBattleEnd = (menang: boolean) => {
    const result = {
      menang,
      pesan: menang ? 'LANJUTKAN PERJALANAN!' : 'ULANGI DARI AWAL!'
    };
    
    handleBattleEnd(result);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-purple-900 to-blue-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading Event Page...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-purple-900 to-blue-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="text-red-400 text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold mb-2">Error</h2>
          <p className="text-gray-300 mb-4">{error}</p>
          <button
            onClick={() => window.history.back()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
          >
            Kembali
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-purple-900 to-blue-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="text-red-400 text-6xl mb-4">👤</div>
          <h2 className="text-2xl font-bold mb-2">User Not Found</h2>
          <p className="text-gray-300 mb-4">Please go back to dashboard to select team</p>
          <button
            onClick={() => window.history.back()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
          >
            Kembali
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-purple-900 to-blue-900 text-white">
      {/* Header */}
      <div className="bg-black/30 backdrop-blur-sm border-b border-white/20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full ${user.tim === 'merah' ? 'bg-red-600' : 'bg-white'}`}></div>
              <div>
                <h1 className="text-xl font-bold">Event Battle</h1>
                <p className="text-sm text-gray-300">Tim {user.tim.toUpperCase()}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-300">Player</p>
              <p className="font-bold">{user.nama}</p>
              {isGameMaster && (
                <div className="flex items-center gap-1 mt-1">
                  <Crown className="w-4 h-4 text-yellow-400" />
                  <span className="text-xs text-yellow-400">Game Master</span>
                </div>
              )}
              <a
                href="/admin"
                className="block mt-2 text-xs text-blue-300 hover:text-blue-200 transition-colors"
              >
                ⚙️ Admin Panel
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Status Card */}
        <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-white/20">
          <div className="flex items-center gap-3 mb-4">
            <Zap className="w-6 h-6 text-yellow-400" />
            <h2 className="text-lg font-bold">Status Pertempuran</h2>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-400">{battleStatus}</p>
            {nearbyPlayers.length > 0 && (
              <p className="text-sm text-gray-300 mt-2">
                {nearbyPlayers.length} pemain terdekat terdeteksi
              </p>
            )}
          </div>
        </div>

        {/* Game Master Controls */}
        {isGameMaster && !activeBattle && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-black/30 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-white/20"
          >
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Crown className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Game Master Controls</h3>
              <p className="text-gray-300 mb-6">
                Klik tombol di bawah untuk memulai pertempuran
              </p>
              
              <button
                onClick={triggerManualBattle}
                className="w-full py-4 px-8 rounded-xl font-bold text-lg transition-all duration-200 transform bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 hover:scale-105 active:scale-95"
              >
                <div className="flex items-center justify-center gap-2">
                  <Sword className="w-5 h-5" />
                  <span>⚔️ TRIGGER BATTLE</span>
                </div>
              </button>
            </div>
          </motion.div>
        )}

        {/* Participant Waiting */}
        {!isGameMaster && !activeBattle && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-black/30 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-white/20"
          >
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Menunggu Game Master</h3>
              <p className="text-gray-300 mb-6">
                Game Master akan memulai pertempuran. Bersiaplah!
              </p>
              
              <div className="flex items-center justify-center gap-2 text-blue-300">
                <div className="animate-pulse">⏳</div>
                <span>Menunggu...</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Battle Modal */}
        <AnimatePresence>
          {activeBattle && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 flex items-center justify-center z-[9999] p-4"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="bg-gradient-to-br from-red-900 to-blue-900 rounded-2xl p-6 max-w-md w-full text-white shadow-2xl border border-white/20"
              >
                {/* Battle Header */}
                <div className="text-center mb-6">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <div className={`w-4 h-4 rounded-full ${user.tim === 'merah' ? 'bg-red-500' : 'bg-white'}`}></div>
                    <span className="text-sm text-gray-300">vs</span>
                    <div className={`w-4 h-4 rounded-full ${user.tim === 'merah' ? 'bg-white' : 'bg-red-500'}`}></div>
                  </div>
                  <h3 className="text-lg font-bold">Pertempuran!</h3>
                  <p className="text-sm text-gray-300">Lawan: {activeBattle.lawan.nama}</p>
                </div>

                {/* Question */}
                <div className="bg-black/30 rounded-lg p-4 mb-6">
                  <h4 className="font-bold mb-2">Pertanyaan:</h4>
                  <p className="text-gray-200">{activeBattle.pertanyaan}</p>
                </div>

                {/* Answer Choices */}
                <div className="space-y-3 mb-6">
                  {Object.entries(activeBattle.pilihanJawaban).map(([key, pilihan]) => (
                    <button
                      key={key}
                      onClick={() => handleSubmitAnswer(pilihan)}
                      disabled={isSubmitting}
                      className={`w-full p-3 rounded-lg text-left transition-all ${
                        selectedAnswer === pilihan
                          ? 'bg-blue-600 border-2 border-blue-400'
                          : 'bg-black/30 hover:bg-black/50 border border-white/20'
                      } ${isSubmitting ? 'cursor-not-allowed opacity-50' : ''}`}
                    >
                      <span className="font-bold mr-2">{key.toUpperCase()}.</span>
                      {pilihan}
                    </button>
                  ))}
                </div>

                {/* Game Master End Buttons */}
                {isGameMaster && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleManualBattleEnd(true)}
                      disabled={isSubmitting}
                      className="flex-1 bg-green-600 hover:bg-green-700 py-2 px-4 rounded-lg font-bold transition-all"
                    >
                      🏆 Menang
                    </button>
                    <button
                      onClick={() => handleManualBattleEnd(false)}
                      disabled={isSubmitting}
                      className="flex-1 bg-red-600 hover:bg-red-700 py-2 px-4 rounded-lg font-bold transition-all"
                    >
                      💔 Kalah
                    </button>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Battle Result Modal */}
        <AnimatePresence>
          {battleResult && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className={`bg-white rounded-lg p-8 text-center max-w-md mx-4 ${
                  battleResult.menang ? 'border-4 border-green-500' : 'border-4 border-red-500'
                }`}
              >
                <div className={`text-6xl mb-4 ${battleResult.menang ? 'text-green-500' : 'text-red-500'}`}>
                  {battleResult.menang ? '🎉' : '💔'}
                </div>
                <h3 className={`text-2xl font-bold mb-2 ${battleResult.menang ? 'text-green-600' : 'text-red-600'}`}>
                  {battleResult.menang ? 'MENANG!' : 'KALAH'}
                </h3>
                <p className="text-gray-600">{battleResult.pesan}</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Socket Manager */}
        {user && (
          <SocketManager
            ref={socketManagerRef}
            user={user}
            onReady={handleSocketManagerReady}
            onBattleStart={handleBattleStart}
            onBattleEnd={handleBattleEnd}
            onNearbyPlayers={handleNearbyPlayers}
          />
        )}
      </div>
    </div>
  );
} 