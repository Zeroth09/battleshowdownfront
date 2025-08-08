'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Users, Zap, AlertCircle } from 'lucide-react';

// Dynamic imports untuk menghindari SSR issues
const MapComponent = dynamic(() => import('../../components/MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-96 bg-gray-200 rounded-lg flex items-center justify-center">
      <div className="text-gray-500">Loading map...</div>
    </div>
  ),
});

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

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [nearbyPlayers, setNearbyPlayers] = useState<any[]>([]);
  const [activeBattle, setActiveBattle] = useState<Battle | null>(null);
  const [battleResult, setBattleResult] = useState<BattleResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const socketManagerRef = useRef<any>(null);
  const [socketManagerReady, setSocketManagerReady] = useState(false);
  const [socketManagerInstance, setSocketManagerInstance] = useState<any>(null);

  // Effect untuk memastikan ref siap
  useEffect(() => {
    if (socketManagerRef.current && socketManagerReady) {
      setSocketManagerInstance(socketManagerRef.current);
      console.log('✅ SocketManager ref is ready:', socketManagerRef.current);
    }
  }, [socketManagerRef.current, socketManagerReady]);

  // Listen for battle cancellation events
  useEffect(() => {
    const handleBattleCancelledEvent = (event: CustomEvent) => {
      console.log('❌ Received battle-cancelled event:', event.detail);
      handleBattleCancelled(event.detail);
    };

    const handleBattleErrorEvent = (event: CustomEvent) => {
      console.log('❌ Received battle-error event:', event.detail);
      handleBattleError(event.detail);
    };

    window.addEventListener('battle-dibatalkan', handleBattleCancelledEvent as EventListener);
    window.addEventListener('battle-error', handleBattleErrorEvent as EventListener);
    
    return () => {
      window.removeEventListener('battle-dibatalkan', handleBattleCancelledEvent as EventListener);
      window.removeEventListener('battle-error', handleBattleErrorEvent as EventListener);
    };
  }, []);

  useEffect(() => {
    // Ambil tim dari localStorage
    const selectedTeam = localStorage.getItem('selectedTeam') || 'merah';
    
    // Buat user default
    const defaultUser: User = {
      pemainId: `player_${Date.now()}`,
      nama: `Pemain ${Math.floor(Math.random() * 1000)}`,
      tim: selectedTeam as 'merah' | 'putih',
    };

    setUser(defaultUser);
    localStorage.setItem('user', JSON.stringify(defaultUser));

    // Get location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocation({ latitude, longitude });
          setIsLoading(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          setError('Tidak dapat mengakses lokasi. Pastikan izin lokasi diaktifkan.');
          setIsLoading(false);
        }
      );
    } else {
      setError('Geolocation tidak didukung di browser ini.');
      setIsLoading(false);
    }
  }, []);

  const handleBattleStart = (battleData: Battle) => {
    console.log('🎯 handleBattleStart called with:', battleData);
    
    // Validate battle data before setting
    if (battleData && battleData.pilihanJawaban && typeof battleData.pilihanJawaban === 'object') {
      console.log('✅ Setting activeBattle with valid data');
      console.log('🎯 Battle ID:', battleData.id);
      setActiveBattle(battleData);
      
      // Store battle data in localStorage as backup
      localStorage.setItem('currentBattle', JSON.stringify(battleData));
      console.log('✅ Battle data stored in localStorage');
      
      // Clear any old battle data
      localStorage.removeItem('oldBattle');
    } else {
      console.error('❌ Invalid battle data:', battleData);
    }
  };

  const handleBattleEnd = (result: any) => {
    console.log('🎯 handleBattleEnd called with:', result);
    console.log('👤 Current user pemainId:', user?.pemainId);
    
    // Tentukan pesan berdasarkan hasil
    let pesan = '';
    let menang = false;
    
    if (result.pemenang === user?.pemainId) {
      if (result.pesan.includes('benar')) {
        menang = true;
        pesan = '🎉 LANJUTKAN PERJALANAN!';
      } else {
        menang = false;
        pesan = '💔 ULANGI DARI AWAL!';
      }
    } else {
      if (result.pesan.includes('benar')) {
        menang = false;
        pesan = '💔 ULANGI DARI AWAL!';
      } else {
        menang = true;
        pesan = '🎉 LANJUTKAN PERJALANAN!';
      }
    }
    
    console.log('🏆 Final result:', { menang, pesan });
    
    setBattleResult({
      menang,
      pesan
    });
    setActiveBattle(null);
    
    // Auto-hide result after 5 seconds
    setTimeout(() => {
      setBattleResult(null);
    }, 5000);
  };

  const handleBattleCancelled = (data: any) => {
    console.log('❌ handleBattleCancelled called with:', data);
    
    // Clear active battle
    setActiveBattle(null);
    
    // Clear localStorage
    localStorage.removeItem('currentBattle');
    
    // Show cancellation message
    setBattleResult({
      menang: false,
      pesan: '❌ BATTLE DIBATALKAN - Pemain terputus'
    });
    
    // Auto-hide result after 3 seconds
    setTimeout(() => {
      setBattleResult(null);
    }, 3000);
    
    console.log('✅ Battle cancelled, state cleared');
  };

  const handleBattleError = (data: any) => {
    console.log('❌ handleBattleError called with:', data);
    
    // Clear active battle
    setActiveBattle(null);
    
    // Clear localStorage
    localStorage.removeItem('currentBattle');
    
    // Show error message
    setBattleResult({
      menang: false,
      pesan: '❌ BATTLE ERROR - Battle tidak ditemukan'
    });
    
    // Auto-hide result after 3 seconds
    setTimeout(() => {
      setBattleResult(null);
    }, 3000);
    
    console.log('✅ Battle error handled, state cleared');
  };

  const handleNearbyPlayers = (players: any[]) => {
    setNearbyPlayers(players);
  };

  const handleSubmitAnswer = (answer: string) => {
    console.log('🎯 handleSubmitAnswer called with:', answer);
    console.log('🎯 activeBattle:', activeBattle);
    console.log('🎯 socketManagerRef.current:', socketManagerRef.current);
    console.log('🎯 socketManagerReady:', socketManagerReady);
    console.log('🎯 socketManagerInstance:', socketManagerInstance);
    
    // Get battle data from state or localStorage backup
    let battleData = activeBattle;
    if (!battleData || !battleData.pilihanJawaban || Object.keys(battleData.pilihanJawaban).length === 0) {
      console.log('🔄 activeBattle is empty, trying localStorage backup...');
      const storedBattle = localStorage.getItem('currentBattle');
      if (storedBattle) {
        try {
          battleData = JSON.parse(storedBattle);
          console.log('✅ Retrieved battle data from localStorage:', battleData);
        } catch (error) {
          console.error('❌ Error parsing stored battle data:', error);
        }
      }
    }
    
    if (!battleData || !battleData.id) {
      console.error('❌ No valid battle data found');
      return;
    }
    
    // Validate battleId is not test_battle
    if (battleData.id === 'test_battle') {
      console.error('❌ Invalid battleId: test_battle');
      return;
    }
    
    console.log('🎯 Using battleId:', battleData.id);
    console.log('🎯 Current activeBattle ID:', activeBattle?.id);
    console.log('🎯 Battle data ID:', battleData.id);
    
    // Try multiple ways to get submitAnswer function
    let submitAnswerFunc = null;
    
    if (socketManagerRef.current?.submitAnswer) {
      submitAnswerFunc = socketManagerRef.current.submitAnswer;
      console.log('🎯 Found submitAnswer in ref.current');
    } else if (socketManagerInstance?.submitAnswer) {
      submitAnswerFunc = socketManagerInstance.submitAnswer;
      console.log('🎯 Found submitAnswer in instance');
    }
    
    if (submitAnswerFunc && socketManagerReady) {
      console.log('🎯 Calling submitAnswer...');
      submitAnswerFunc(battleData.id, answer);
    } else {
      console.error('❌ submitAnswer function not available');
      console.error('❌ socketManagerRef.current:', socketManagerRef.current);
      console.error('❌ socketManagerInstance:', socketManagerInstance);
      console.error('❌ socketManagerReady:', socketManagerReady);
      
      // Wait a bit and try again
      setTimeout(() => {
        console.log('🔄 Retrying submitAnswer after delay...');
        if (socketManagerRef.current?.submitAnswer) {
          console.log('🎯 Found submitAnswer in retry');
          socketManagerRef.current.submitAnswer(battleData.id, answer);
        } else {
          console.error('❌ Still no submitAnswer available after retry');
        }
      }, 1000);
      
      // Fallback: try to emit directly if we have socket
      console.log('🔄 Trying fallback method...');
      if (typeof window !== 'undefined' && (window as any).socket) {
        console.log('🎯 Using window.socket fallback');
        (window as any).socket.emit('jawab-battle', {
          battleId: battleData.id,
          jawaban: answer,
          pemainId: user?.pemainId
        });
        console.log('✅ Fallback event emitted successfully');
      } else {
        console.error('❌ No socket available for fallback');
        
        // Last resort: try to find socket in any way possible
        console.log('🔄 Trying last resort method...');
        const socket = (window as any).socket || socketManagerRef.current || socketManagerInstance;
        if (socket && socket.emit) {
          console.log('🎯 Using last resort socket');
          socket.emit('jawab-battle', {
            battleId: battleData.id,
            jawaban: answer,
            pemainId: user?.pemainId
          });
          console.log('✅ Last resort event emitted successfully');
        } else {
          console.error('❌ No socket found anywhere');
        }
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p>Memuat game...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-400" />
          <h2 className="text-2xl font-bold mb-2">Error</h2>
          <p className="text-gray-300">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-gray-900">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-4 h-4 rounded-full ${user?.tim === 'merah' ? 'bg-red-500' : 'bg-white'}`}></div>
              <div>
                <h1 className="text-white font-bold">{user?.nama}</h1>
                <p className="text-gray-300 text-sm">Tim {user?.tim === 'merah' ? 'Merah' : 'Putih'}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 text-white">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>{nearbyPlayers.length} pemain terdekat</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map Section */}
          <div className="lg:col-span-2">
            <div className={`bg-white rounded-lg shadow-lg overflow-hidden ${activeBattle ? 'blur-sm' : ''}`}>
              <div className="p-4 bg-gray-50 border-b">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Peta Pertempuran
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Bergerak untuk mencari lawan. Battle otomatis saat bertemu dalam jarak 1-2 meter.
                </p>
              </div>
              
              {location && (
                <div className={`h-96 ${activeBattle ? 'pointer-events-none' : 'pointer-events-auto'}`}>
                  <MapComponent
                    userLocation={location}
                    userTeam={user?.tim || 'merah'}
                    nearbyPlayers={nearbyPlayers}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Status Panel */}
          <div className="space-y-6">
            {/* Battle Status */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Status Pertempuran
              </h3>
              
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500">Belum ada battle</p>
                <p className="text-sm text-gray-400 mt-1">Cari lawan di peta</p>
              </div>
            </div>

            {/* Nearby Players */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Pemain Terdekat</h3>
              
              {nearbyPlayers.length > 0 ? (
                <div className="space-y-3">
                  {nearbyPlayers.map((player, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className={`w-3 h-3 rounded-full ${player.tim === 'merah' ? 'bg-red-500' : 'bg-white border border-gray-300'}`}></div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">{player.nama}</p>
                        <p className="text-sm text-gray-500">Tim {player.tim === 'merah' ? 'Merah' : 'Putih'}</p>
                      </div>
                      <div className="text-sm text-gray-400">
                        {player.jarak ? `${player.jarak.toFixed(1)}m` : 'Nearby'}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-gray-500">Tidak ada pemain terdekat</p>
                  <p className="text-sm text-gray-400 mt-1">Bergerak untuk mencari lawan</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Active Battle Modal */}
      <AnimatePresence>
        {activeBattle && activeBattle.pilihanJawaban && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 flex items-center justify-center z-[9999] pointer-events-auto"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-gradient-to-br from-red-600 to-red-800 rounded-2xl p-8 text-center max-w-lg mx-4 text-white shadow-2xl"
            >
              {/* Battle Header */}
              <div className="mb-6">
                <div className="text-4xl mb-2">⚔️</div>
                <h2 className="text-2xl font-bold mb-2">BATTLE!</h2>
                <p className="text-red-200">vs {activeBattle.lawan?.nama || 'Unknown'}</p>
              </div>

              {/* Question */}
              <div className="mb-6">
                <p className="text-lg font-semibold mb-4">{activeBattle.pertanyaan}</p>
              </div>

              {/* Answer Options */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                {Object.entries(activeBattle.pilihanJawaban).map(([key, value]) => (
                  <button
                    key={key}
                    onClick={() => handleSubmitAnswer(key)}
                    className="bg-white/10 hover:bg-white/20 border border-white/30 rounded-lg p-4 text-sm transition-all duration-200 hover:scale-105"
                  >
                    <div className="font-bold text-lg mb-1">{key.toUpperCase()}</div>
                    <div className="text-sm">{value}</div>
                  </button>
                ))}
              </div>

              {/* Timer */}
              <div className="text-red-200 text-sm">
                ⏰ Jawab cepat untuk menang!
              </div>
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
      {user && location && (
        <SocketManager
          ref={socketManagerRef}
          user={user}
          initialLocation={location}
          onBattleStart={handleBattleStart}
          onBattleEnd={handleBattleEnd}
          onNearbyPlayers={handleNearbyPlayers}
          onReady={() => {
            console.log('✅ SocketManager ready!');
            setSocketManagerReady(true);
            // Also store the instance
            if (socketManagerRef.current) {
              setSocketManagerInstance(socketManagerRef.current);
              console.log('✅ SocketManager instance stored');
            }
          }}
        />
      )}
    </div>
  );
} 