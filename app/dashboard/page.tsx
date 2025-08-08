'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Users, Zap, AlertCircle } from 'lucide-react';
import dynamic from 'next/dynamic';

const MapComponent = dynamic(() => import('../../components/MapComponent'), {
  ssr: false,
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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [socketManagerReady, setSocketManagerReady] = useState(false);
  const [socketManagerInstance, setSocketManagerInstance] = useState<any>(null);
  const [activeBattle, setActiveBattle] = useState<Battle | null>(null);
  const [battleResult, setBattleResult] = useState<BattleResult | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nearbyPlayers, setNearbyPlayers] = useState<any[]>([]);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  const socketManagerRef = useRef<any>(null);

  useEffect(() => {
    // Load user data from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        console.log('👤 User loaded:', parsedUser);
      } catch (error) {
        console.error('❌ Error parsing user data:', error);
        setError('Error loading user data');
      }
    } else {
      setError('User data not found. Please go back to dashboard.');
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    // Get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocation({ latitude, longitude });
          console.log('📍 Location obtained:', { latitude, longitude });
        },
        (error) => {
          console.error('❌ Error getting location:', error);
          // Default location (Jakarta)
          setLocation({ latitude: -6.2088, longitude: 106.8456 });
        }
      );
    } else {
      // Default location (Jakarta)
      setLocation({ latitude: -6.2088, longitude: 106.8456 });
    }
  }, []);

  useEffect(() => {
    // Listen for custom events
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

  const handleSocketManagerReady = () => {
    console.log('🔌 Socket manager ready');
    setSocketManagerReady(true);
  };

  const handleBattleStart = (battleData: Battle) => {
    console.log('⚔️ Battle started:', battleData);
    setActiveBattle(battleData);
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
    setSelectedAnswer(null);
    setIsSubmitting(false);
    
    // Clear localStorage
    localStorage.removeItem('currentBattle');
    
    // Auto-hide result after 3 seconds
    setTimeout(() => {
      setBattleResult(null);
    }, 3000);
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
    
    if (isSubmitting || !activeBattle) return;
    
    setIsSubmitting(true);
    setSelectedAnswer(answer);
    
    try {
      // Try multiple ways to get submitAnswer function
      let submitAnswer: any = null;
      
      if (socketManagerRef.current?.submitAnswer) {
        submitAnswer = socketManagerRef.current.submitAnswer;
      } else if (socketManagerInstance?.submitAnswer) {
        submitAnswer = socketManagerInstance.submitAnswer;
      } else if ((window as any).socket?.submitAnswer) {
        submitAnswer = (window as any).socket.submitAnswer;
      }
      
      if (submitAnswer) {
        console.log('🎯 Submitting answer:', answer);
        submitAnswer(activeBattle.id, answer);
      } else {
        console.error('❌ submitAnswer not available');
        setError('Error submitting answer. Please try again.');
        
        // Retry after 1 second
        setTimeout(() => {
          if (socketManagerRef.current?.submitAnswer) {
            console.log('🎯 Retrying submitAnswer...');
            socketManagerRef.current.submitAnswer(activeBattle.id, answer);
          }
        }, 1000);
      }
    } catch (error) {
      console.error('❌ Error submitting answer:', error);
      setError('Error submitting answer');
    } finally {
      setIsSubmitting(false);
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
              <a
                href="/event"
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-4 py-2 rounded-lg font-bold transition-all transform hover:scale-105"
              >
                🎯 Event Mode
              </a>
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
                        <p className="text-sm text-gray-500">Tim {player.tim}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">Belum ada pemain terdekat</p>
                  <p className="text-sm text-gray-400">Bergerak untuk mencari lawan</p>
                </div>
              )}
            </div>
          </div>
        </div>

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
                    <div className={`w-4 h-4 rounded-full ${user?.tim === 'merah' ? 'bg-red-500' : 'bg-white'}`}></div>
                    <span className="text-sm text-gray-300">vs</span>
                    <div className={`w-4 h-4 rounded-full ${user?.tim === 'merah' ? 'bg-white' : 'bg-red-500'}`}></div>
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
      </main>
    </div>
  );
} 