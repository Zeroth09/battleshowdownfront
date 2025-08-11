'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Clock, 
  Trophy, 
  Eye, 
  Play,
  Zap,
  AlertCircle,
  CheckCircle,
  XCircle,
  Timer,
  Target,
  Award
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import SocketManager, { SocketManagerRef } from '../../components/SocketManager';

interface Pertanyaan {
  id: string;
  pertanyaan: string;
  pilihanJawaban: {
    a: string;
    b: string;
    c: string;
    d: string;
  };
  jawabanBenar: string;
}

interface Pemain {
  id: string;
  nama: string;
  tim: string;
  status: 'online' | 'offline';
  skor: number;
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

export default function EventPage() {
  const [pemainOnline, setPemainOnline] = useState<Pemain[]>([]);
  const [pertanyaanAktif, setPertanyaanAktif] = useState<Pertanyaan | null>(null);
  const [waktuTersisa, setWaktuTersisa] = useState(0);
  const [statusGame, setStatusGame] = useState<'waiting' | 'playing' | 'finished'>('waiting');
  const [isConnected, setIsConnected] = useState(false);
  const [currentBattleId, setCurrentBattleId] = useState<string | null>(null);
  const [jawabanTerpilih, setJawabanTerpilih] = useState<string | null>(null);
  const [jawabanDikirim, setJawabanDikirim] = useState(false);
  const [hasilBattle, setHasilBattle] = useState<any>(null);
  const [showResult, setShowResult] = useState(false);
  
  const router = useRouter();
  const socketRef = useRef<SocketManagerRef>(null);

  // Mock user data untuk testing (nanti bisa dari auth)
  const currentUser = {
    pemainId: `player_${Date.now()}`,
    nama: 'Peserta Test',
    tim: 'merah' as const
  };

  const handleReady = () => {
    console.log('✅ Socket ready for Player');
    setIsConnected(true);
  };

  const handleBattleStart = (battleData: Battle) => {
    console.log('⚔️ Battle started:', battleData);
    
    // Convert battle data to pertanyaan format
    const pertanyaan: Pertanyaan = {
      id: battleData.id,
      pertanyaan: battleData.pertanyaan,
      pilihanJawaban: battleData.pilihanJawaban,
      jawabanBenar: battleData.jawabanBenar
    };
    
    setPertanyaanAktif(pertanyaan);
    setCurrentBattleId(battleData.id);
    setStatusGame('playing');
    setWaktuTersisa(30); // Default waktu
    setJawabanTerpilih(null);
    setJawabanDikirim(false);
    setHasilBattle(null);
    setShowResult(false);
  };

  const handleBattleEnd = (result: any) => {
    console.log('🏁 Battle ended:', result);
    setStatusGame('finished');
    setHasilBattle(result);
    setShowResult(true);
    
    // Auto hide result after 5 seconds
    setTimeout(() => {
      setShowResult(false);
      setStatusGame('waiting');
      setPertanyaanAktif(null);
      setCurrentBattleId(null);
      setWaktuTersisa(0);
      setJawabanTerpilih(null);
      setJawabanDikirim(false);
    }, 5000);
  };

  const handleLiveAnswer = (answerData: any) => {
    console.log('💬 Live answer received:', answerData);
    // Handle live answer updates if needed
  };

  const handleJawabPertanyaan = async (jawaban: string) => {
    if (!socketRef.current || !currentBattleId || jawabanDikirim) {
      return;
    }

    try {
      setJawabanTerpilih(jawaban);
      setJawabanDikirim(true);
      
      // Send answer via socket
      socketRef.current.socket?.emit('player-answer', {
        battleId: currentBattleId,
        pemainId: currentUser.pemainId,
        jawaban: jawaban,
        timestamp: Date.now()
      });
      
      console.log('📝 Jawaban dikirim:', jawaban);
      
    } catch (error) {
      console.error('Error sending answer:', error);
      setJawabanDikirim(false);
      setJawabanTerpilih(null);
    }
  };

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (statusGame === 'playing' && waktuTersisa > 0) {
      interval = setInterval(() => {
        setWaktuTersisa(prev => {
          if (prev <= 1) {
            // Waktu habis
            if (!jawabanDikirim) {
              // Auto submit if no answer selected
              handleJawabPertanyaan('timeout');
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [statusGame, waktuTersisa, jawabanDikirim]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
      {/* Socket Manager */}
      <SocketManager
        ref={socketRef}
        user={currentUser}
        onReady={handleReady}
        onBattleStart={handleBattleStart}
        onBattleEnd={handleBattleEnd}
        onLiveAnswer={handleLiveAnswer}
      />

      {/* Header */}
      <div className="bg-white shadow-sm border-b border-blue-100">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Battle Showdown</h1>
                <p className="text-sm text-gray-500">Tunggu pertanyaan dari Game Master</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className={`flex items-center space-x-2 ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm font-medium">
                  {isConnected ? 'Terhubung' : 'Terputus'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Game Area */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {statusGame === 'waiting' && (
                <motion.div
                  key="waiting"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-white rounded-3xl shadow-xl p-12 border border-blue-100 text-center"
                >
                  <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Eye className="w-12 h-12 text-blue-600" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">
                    Menunggu Pertanyaan
                  </h2>
                  <p className="text-lg text-gray-600 mb-6">
                    Game Master akan mengirim pertanyaan segera. 
                    Bersiaplah untuk menjawab dengan cepat!
                  </p>
                  
                  <div className="flex items-center justify-center space-x-2 text-blue-600">
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  
                  <div className="mt-8 p-4 bg-blue-50 rounded-2xl">
                    <h3 className="font-semibold text-blue-900 mb-2">📋 Cara Bermain</h3>
                    <div className="text-sm text-blue-800 space-y-1">
                      <p>• Tunggu pertanyaan dari Game Master</p>
                      <p>• Pilih jawaban yang benar</p>
                      <p>• Jawab dengan cepat untuk skor tinggi</p>
                      <p>• Lihat hasil dan ranking setelah selesai</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {statusGame === 'playing' && pertanyaanAktif && (
                <motion.div
                  key="playing"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white rounded-3xl shadow-xl p-8 border border-blue-100"
                >
                  {/* Timer */}
                  <div className="text-center mb-8">
                    <div className="flex items-center justify-center space-x-2 mb-4">
                      <Timer className="w-6 h-6 text-red-600" />
                      <span className="text-lg font-semibold text-gray-700">Waktu Tersisa:</span>
                    </div>
                    <div className="text-6xl font-bold text-red-600 mb-4">
                      {waktuTersisa}s
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-red-500 h-3 rounded-full transition-all duration-1000 ease-linear"
                        style={{ width: `${(waktuTersisa / 30) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Pertanyaan */}
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">
                      {pertanyaanAktif.pertanyaan}
                    </h2>
                  </div>

                  {/* Pilihan Jawaban */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    {Object.entries(pertanyaanAktif.pilihanJawaban).map(([key, value]) => (
                      <motion.button
                        key={key}
                        onClick={() => handleJawabPertanyaan(key)}
                        disabled={jawabanDikirim}
                        className={`p-6 rounded-2xl border-2 text-left transition-all duration-200 ${
                          jawabanTerpilih === key
                            ? jawabanDikirim
                              ? 'border-green-500 bg-green-50 shadow-lg'
                              : 'border-blue-500 bg-blue-50 shadow-lg'
                            : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                        } ${jawabanDikirim ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                        whileHover={!jawabanDikirim ? { scale: 1.02 } : {}}
                        whileTap={!jawabanDikirim ? { scale: 0.98 } : {}}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-lg ${
                            jawabanTerpilih === key
                              ? jawabanDikirim
                                ? 'bg-green-500 text-white'
                                : 'bg-blue-500 text-white'
                              : 'bg-gray-200 text-gray-600'
                          }`}>
                            {key.toUpperCase()}
                          </div>
                          <span className="text-lg font-medium text-gray-900">{value}</span>
                        </div>
                        
                        {jawabanTerpilih === key && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="mt-3 flex items-center justify-center"
                          >
                            {jawabanDikirim ? (
                              <CheckCircle className="w-6 h-6 text-green-600" />
                            ) : (
                              <Target className="w-6 h-6 text-blue-600" />
                            )}
                          </motion.div>
                        )}
                      </motion.button>
                    ))}
                  </div>

                  {/* Status Jawaban */}
                  {jawabanDikirim && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-center p-4 bg-green-50 rounded-2xl border border-green-200"
                    >
                      <div className="flex items-center justify-center space-x-2 text-green-700">
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-semibold">Jawaban sudah dikirim!</span>
                      </div>
                      <p className="text-sm text-green-600 mt-1">
                        Tunggu hasil dari Game Master
                      </p>
                    </motion.div>
                  )}
                </motion.div>
              )}

              {statusGame === 'finished' && showResult && (
                <motion.div
                  key="finished"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-white rounded-3xl shadow-xl p-8 border border-blue-100 text-center"
                >
                  <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Award className="w-12 h-12 text-green-600" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">
                    Game Selesai!
                  </h2>
                  
                  {hasilBattle && (
                    <div className="mb-6">
                      <p className="text-lg text-gray-600 mb-4">
                        {hasilBattle.message || 'Terima kasih telah berpartisipasi!'}
                      </p>
                      
                      {jawabanTerpilih && (
                        <div className="p-4 bg-blue-50 rounded-2xl">
                          <p className="text-sm text-blue-800">
                            <span className="font-semibold">Jawaban Anda:</span> {jawabanTerpilih.toUpperCase()}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="text-sm text-gray-500">
                    Menunggu pertanyaan berikutnya...
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sidebar - Status & Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Connection Status */}
            <div className="bg-white rounded-3xl shadow-xl p-6 border border-blue-100">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <Zap className="w-5 h-5 text-blue-600 mr-2" />
                Status Koneksi
              </h3>
              
              <div className="flex items-center space-x-3 mb-3">
                <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className={`text-sm ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                  {isConnected ? 'Terhubung' : 'Tidak Terhubung'}
                </span>
              </div>
              
              <p className="text-xs text-gray-500">
                {isConnected 
                  ? 'Siap menerima pertanyaan dari Game Master'
                  : 'Menunggu koneksi socket...'
                }
              </p>
            </div>

            {/* Game Status */}
            <div className="bg-white rounded-3xl shadow-xl p-6 border border-blue-100">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <Play className="w-5 h-5 text-blue-600 mr-2" />
                Status Game
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <span className="font-medium text-gray-900">Status</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    statusGame === 'waiting' ? 'bg-blue-100 text-blue-700' :
                    statusGame === 'playing' ? 'bg-green-100 text-green-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {statusGame === 'waiting' ? 'Menunggu' : 
                     statusGame === 'playing' ? 'Bermain' : 'Selesai'}
                  </span>
                </div>
                
                {statusGame === 'playing' && (
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <span className="font-medium text-gray-900">Waktu</span>
                    <span className="font-bold text-red-600">{waktuTersisa}s</span>
                  </div>
                )}
                
                {jawabanTerpilih && (
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <span className="font-medium text-gray-900">Jawaban</span>
                    <span className="font-bold text-blue-600">{jawabanTerpilih.toUpperCase()}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Info Panel */}
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-3xl p-6 border border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-3">🎯 Tips Bermain</h3>
              <div className="space-y-2 text-sm text-blue-800">
                <p>• Baca pertanyaan dengan teliti</p>
                <p>• Pilih jawaban yang paling tepat</p>
                <p>• Jawab dengan cepat untuk skor tinggi</p>
                <p>• Perhatikan waktu yang tersisa</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 