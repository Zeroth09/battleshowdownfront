'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, 
  Users, 
  Trophy, 
  Target,
  Zap,
  Shield,
  Sword,
  X,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import dynamic from 'next/dynamic';

// Import peta secara dinamis untuk menghindari SSR issues
const MapComponent = dynamic(() => import('../../components/MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-96 bg-gray-200 rounded-lg flex items-center justify-center">
      <div className="spinner"></div>
    </div>
  )
});

// Import Socket.IO client
const SocketManager = dynamic(() => import('../../components/SocketManager'), {
  ssr: false
});

interface User {
  pemainId: string;
  nama: string;
  email: string;
  tim: 'merah' | 'putih';
  statistik: {
    totalBattle: number;
    menang: number;
    kalah: number;
    skor: number;
  };
}

interface BattleData {
  battleId: string;
  lawan: string;
  timLawan: string;
  pertanyaan: {
    pertanyaan: string;
    pilihanJawaban: {
      a: string;
      b: string;
      c: string;
      d: string;
    };
    jawabanBenar: string;
  };
}

interface BattleResult {
  pemenang: string;
  timPemenang: string;
  hasil: 'menang' | 'kalah';
  instruksi: string;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [battleData, setBattleData] = useState<BattleData | null>(null);
  const [battleResult, setBattleResult] = useState<BattleResult | null>(null);
  const [showBattle, setShowBattle] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [answerSubmitted, setAnswerSubmitted] = useState(false);
  const [nearbyPlayers, setNearbyPlayers] = useState<any[]>([]);
  const [userLocation, setUserLocation] = useState<{latitude: number, longitude: number} | null>(null);

  useEffect(() => {
    // Set user default tanpa autentikasi
    const defaultUser = {
      pemainId: 'user_' + Date.now(),
      nama: 'Pemain ' + Math.floor(Math.random() * 1000),
      email: 'pemain@example.com',
      tim: Math.random() > 0.5 ? 'merah' : 'putih' as 'merah' | 'putih',
      statistik: {
        totalBattle: 0,
        menang: 0,
        kalah: 0,
        skor: 0
      }
    };
    
    setUser(defaultUser);

    // Get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ latitude, longitude });
          
          // Update lokasi ke server
          updateLocation(latitude, longitude);
        },
        (error) => {
          console.error('Error getting location:', error);
          // Default location (Jakarta)
          setUserLocation({ latitude: -6.2088, longitude: 106.8456 });
        }
      );
    }

    setLoading(false);
  }, []);

  const updateLocation = async (latitude: number, longitude: number) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/pemain/update-lokasi`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ latitude, longitude })
      });
    } catch (error) {
      console.error('Error updating location:', error);
    }
  };

  const handleBattleStart = (data: BattleData) => {
    setBattleData(data);
    setShowBattle(true);
    setSelectedAnswer('');
    setAnswerSubmitted(false);
  };

  const handleBattleEnd = (result: BattleResult) => {
    setBattleResult(result);
    setShowBattle(false);
    
    // Update statistik user
    if (user) {
      const updatedUser = { ...user };
      updatedUser.statistik.totalBattle += 1;
      if (result.hasil === 'menang') {
        updatedUser.statistik.menang += 1;
        updatedUser.statistik.skor += 10;
      } else {
        updatedUser.statistik.kalah += 1;
        updatedUser.statistik.skor = Math.max(0, updatedUser.statistik.skor - 5);
      }
      setUser(updatedUser);
    }

    // Simpan ke localStorage
    localStorage.setItem('user', JSON.stringify(user));
  };

  const handleAnswerSubmit = (answer: string) => {
    if (answerSubmitted || !battleData) return;
    
    setSelectedAnswer(answer);
    setAnswerSubmitted(true);
    
    // Kirim jawaban ke server via Socket.IO
    // Ini akan dihandle oleh SocketManager component
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-white">Memuat dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-gray-900">
      {/* Socket Manager */}
      <SocketManager 
        user={user}
        onBattleStart={handleBattleStart}
        onBattleEnd={handleBattleEnd}
        onNearbyPlayers={setNearbyPlayers}
      />

      {/* Header */}
      <header className="bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`w-10 h-10 rounded-full ${user.tim === 'merah' ? 'bg-red-500' : 'bg-gray-300'}`}></div>
              <div>
                <h1 className="text-xl font-bold text-white">{user.nama}</h1>
                <p className="text-gray-300 text-sm">Tim {user.tim}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="text-center">
                <p className="text-white font-semibold">{user.statistik.skor}</p>
                <p className="text-gray-300 text-xs">Skor</p>
              </div>
              <div className="text-center">
                <p className="text-white font-semibold">{user.statistik.totalBattle}</p>
                <p className="text-gray-300 text-xs">Battle</p>
              </div>
              <div className="text-center">
                <p className="text-white font-semibold">{user.statistik.menang}</p>
                <p className="text-gray-300 text-xs">Menang</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Map Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                  <MapPin className="w-6 h-6 mr-2 text-red-500" />
                  Peta Pertempuran
                </h2>
                <p className="text-gray-600 mt-2">
                  Jelajahi area dan cari pemain lawan untuk bertempur
                </p>
              </div>
              
              <div className="h-96">
                {userLocation && (
                  <MapComponent 
                    userLocation={userLocation}
                    userTeam={user.tim}
                    nearbyPlayers={nearbyPlayers}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Card */}
            <div className="bg-white rounded-2xl shadow-2xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Target className="w-5 h-5 mr-2 text-red-500" />
                Status Pertempuran
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Status</span>
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                    Online
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Pemain Dekat</span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    {nearbyPlayers.length}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Tim Lawan</span>
                  <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                    {user.tim === 'merah' ? 'Putih' : 'Merah'}
                  </span>
                </div>
              </div>
            </div>

            {/* Statistik Card */}
            <div className="bg-white rounded-2xl shadow-2xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Trophy className="w-5 h-5 mr-2 text-yellow-500" />
                Statistik
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Total Battle</span>
                  <span className="font-semibold">{user.statistik.totalBattle}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Menang</span>
                  <span className="font-semibold text-green-600">{user.statistik.menang}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Kalah</span>
                  <span className="font-semibold text-red-600">{user.statistik.kalah}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Win Rate</span>
                  <span className="font-semibold">
                    {user.statistik.totalBattle > 0 
                      ? `${((user.statistik.menang / user.statistik.totalBattle) * 100).toFixed(1)}%`
                      : '0%'
                    }
                  </span>
                </div>
              </div>
            </div>

            {/* Instruksi Card */}
            <div className="bg-white rounded-2xl shadow-2xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Zap className="w-5 h-5 mr-2 text-blue-500" />
                Instruksi
              </h3>
              
              <div className="space-y-3 text-sm text-gray-600">
                <p>• Bergerak di area untuk mencari lawan</p>
                <p>• Ketika bertemu lawan, battle otomatis dimulai</p>
                <p>• Jawab pertanyaan dengan cepat dan akurat</p>
                <p>• Pemain pertama yang jawab benar menang</p>
                <p>• Jika menang, lanjutkan perjalanan</p>
                <p>• Jika kalah, kembali ke awal</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Battle Modal */}
      <AnimatePresence>
        {showBattle && battleData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Battle Showdown!</h2>
                  <button
                    onClick={() => setShowBattle(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full ${user.tim === 'merah' ? 'bg-red-500' : 'bg-gray-300'}`}></div>
                      <span className="font-semibold">{user.nama}</span>
                    </div>
                    <span className="text-gray-500">VS</span>
                    <div className="flex items-center space-x-3">
                      <span className="font-semibold">{battleData.lawan}</span>
                      <div className={`w-8 h-8 rounded-full ${battleData.timLawan === 'merah' ? 'bg-red-500' : 'bg-gray-300'}`}></div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-red-500 to-red-700 text-white p-4 rounded-lg mb-6">
                    <h3 className="font-semibold mb-2">Pertanyaan:</h3>
                    <p className="text-lg">{battleData.pertanyaan.pertanyaan}</p>
                  </div>

                  <div className="space-y-3">
                    {Object.entries(battleData.pertanyaan.pilihanJawaban).map(([key, value]) => (
                      <button
                        key={key}
                        onClick={() => handleAnswerSubmit(key)}
                        disabled={answerSubmitted}
                        className={`w-full p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                          selectedAnswer === key
                            ? 'border-red-500 bg-red-50 text-red-700'
                            : 'border-gray-300 hover:border-red-300'
                        } ${answerSubmitted ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">{key.toUpperCase()}. {value}</span>
                          {selectedAnswer === key && (
                            <CheckCircle className="w-5 h-5 text-red-500" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {answerSubmitted && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-blue-800 text-center font-semibold">
                      Menunggu lawan menjawab...
                    </p>
                  </div>
                )}
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
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className={`bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center ${
                battleResult.hasil === 'menang' ? 'border-4 border-green-500' : 'border-4 border-red-500'
              }`}
            >
              <div className={`w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center ${
                battleResult.hasil === 'menang' ? 'bg-green-100' : 'bg-red-100'
              }`}>
                {battleResult.hasil === 'menang' ? (
                  <CheckCircle className="w-12 h-12 text-green-600" />
                ) : (
                  <XCircle className="w-12 h-12 text-red-600" />
                )}
              </div>

              <h2 className={`text-3xl font-bold mb-4 ${
                battleResult.hasil === 'menang' ? 'text-green-600' : 'text-red-600'
              }`}>
                {battleResult.hasil === 'menang' ? 'MENANG!' : 'KALAH!'}
              </h2>

              <p className="text-gray-600 mb-6">
                {battleResult.hasil === 'menang' 
                  ? `Selamat! Kamu berhasil mengalahkan ${battleResult.pemenang}`
                  : `Sayang sekali, ${battleResult.pemenang} lebih cepat!`
                }
              </p>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p className="font-semibold text-gray-800">{battleResult.instruksi}</p>
              </div>

              <button
                onClick={() => setBattleResult(null)}
                className="btn-primary w-full"
              >
                Lanjutkan
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 