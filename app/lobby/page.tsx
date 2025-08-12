'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Clock, Trophy, Zap, AlertCircle, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import SocketManager, { SocketManagerRef } from '../../components/SocketManager';

interface PemainData {
  pemainId: string;
  nama: string;
  tim: 'merah' | 'putih';
  masukAt: string;
  lokasi?: {
    latitude: number;
    longitude: number;
  };
}

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
  waktu: number;
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

export default function LobbyPage() {
  const [pemainData, setPemainData] = useState<PemainData | null>(null);
  const [pemainLain, setPemainLain] = useState<PemainData[]>([]);
  const [status, setStatus] = useState<'menunggu' | 'pertanyaan' | 'hasil'>('menunggu');
  const [pertanyaan, setPertanyaan] = useState<Battle | null>(null);
  const [waktuTersisa, setWaktuTersisa] = useState(0);
  const [jawabanDipilih, setJawabanDipilih] = useState<string | null>(null);
  const [hasil, setHasil] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const router = useRouter();
  const socketRef = useRef<SocketManagerRef>(null);

  useEffect(() => {
    // Ambil data pemain dari localStorage
    const data = localStorage.getItem('pemainData');
    if (!data) {
      router.push('/');
      return;
    }

    const parsedData = JSON.parse(data);
    setPemainData(parsedData);
  }, [router]);

  const handleReady = () => {
    console.log('✅ Socket ready');
    setIsConnected(true);
  };

  const handleBattleStart = (battleData: Battle) => {
    console.log('⚔️ Battle started:', battleData);
    setPertanyaan(battleData);
    setStatus('pertanyaan');
    setWaktuTersisa(30); // Default waktu 30 detik
    setJawabanDipilih(null);
    setHasil(null);
  };

  const handleBattleEnd = (result: any) => {
    console.log('🏁 Battle finished:', result);
    setStatus('hasil');
    setHasil(result);
    setPertanyaan(null);
  };

  const handleLiveAnswer = (answerData: any) => {
    console.log('👁️ Live answer received:', answerData);
    // Update real-time player answers
  };

  // Handle lobby update events
  const handleLobbyUpdate = (data: any) => {
    console.log('👥 Lobby updated:', data);
    if (data.players && Array.isArray(data.players)) {
      // Filter out current player from the list
      const otherPlayers = data.players.filter(
        (pemain: PemainData) => pemain.pemainId !== pemainData?.pemainId
      );
      setPemainLain(otherPlayers);
      console.log('✅ Updated pemain lain:', otherPlayers);
    }
  };

  // Listen for lobby updates
  useEffect(() => {
    if (socketRef.current?.socket) {
      const socket = socketRef.current.socket;
      
      // Debug: Log semua event yang diterima
      const debugHandler = (eventName: string, data: any) => {
        console.log(`🔍 [DEBUG] Event received: ${eventName}`, data);
        log(`🔍 Event: ${eventName}`, data);
      };
      
      // Listen untuk semua event
      socket.onAny(debugHandler);
      
      // Specific handler untuk lobby-update
      socket.on('lobby-update', handleLobbyUpdate);
      
      return () => {
        socket.offAny(debugHandler);
        socket.off('lobby-update', handleLobbyUpdate);
      };
    }
  }, [socketRef.current?.socket, pemainData?.pemainId]);

  // Debug logging function
  const log = (message: string, data?: any) => {
    console.log(`[${pemainData?.nama}] ${message}`, data);
  };

  const handleJawab = async (jawaban: string) => {
    if (!socketRef.current || !pertanyaan) return;
    
    try {
      setJawabanDipilih(jawaban);
      await socketRef.current.submitAnswer(pertanyaan.id, jawaban);
    } catch (error) {
      console.error('Error submitting answer:', error);
    }
  };

  const handleLanjutkan = () => {
    // Reset untuk pertanyaan berikutnya
    setStatus('menunggu');
    setPertanyaan(null);
    setJawabanDipilih(null);
    setHasil(null);
  };

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (status === 'pertanyaan' && waktuTersisa > 0) {
      interval = setInterval(() => {
        setWaktuTersisa(prev => {
          if (prev <= 1) {
            // Waktu habis, tunjukkan hasil
            setStatus('hasil');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [status, waktuTersisa]);

  if (!pemainData) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-100">
      {/* Socket Manager */}
      <SocketManager
        ref={socketRef}
        user={pemainData}
        onReady={handleReady}
        onBattleStart={handleBattleStart}
        onBattleEnd={handleBattleEnd}
        onLiveAnswer={handleLiveAnswer}
      />

      {/* Header */}
      <div className="bg-white shadow-sm border-b border-red-100">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${pemainData.tim === 'merah' ? 'bg-red-500' : 'bg-gray-400'}`}></div>
              <span className="font-semibold text-gray-900">{pemainData.nama}</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                pemainData.tim === 'merah' 
                  ? 'bg-red-100 text-red-700' 
                  : 'bg-gray-100 text-gray-700'
              }`}>
                Tim {pemainData.tim === 'merah' ? 'Merah' : 'Putih'}
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <div className={`flex items-center space-x-2 ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm font-medium">
                  {isConnected ? 'Terhubung' : 'Terputus'}
                </span>
              </div>
              <span className="text-sm text-gray-500">Lobby Battle</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {status === 'menunggu' && (
                <motion.div
                  key="menunggu"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white rounded-3xl shadow-xl p-8 border border-red-100"
                >
                  <div className="text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <Clock className="w-10 h-10 text-white" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">
                      Menunggu Pertanyaan
                    </h2>
                    <p className="text-gray-600 mb-8">
                      Game Master sedang menyiapkan pertanyaan untuk kamu. Sabar ya!
                    </p>
                    
                    <div className="inline-flex items-center space-x-2 bg-red-50 px-4 py-2 rounded-full">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="text-red-700 font-medium">Menunggu...</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {status === 'pertanyaan' && pertanyaan && (
                <motion.div
                  key="pertanyaan"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white rounded-3xl shadow-xl p-8 border border-red-100"
                >
                  {/* Timer */}
                  <div className="text-center mb-6">
                    <div className="inline-flex items-center space-x-2 bg-red-100 px-4 py-2 rounded-full">
                      <Clock className="w-4 h-4 text-red-600" />
                      <span className="text-red-700 font-bold text-lg">
                        {waktuTersisa}s
                      </span>
                    </div>
                  </div>

                  {/* Pertanyaan */}
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">
                      {pertanyaan.pertanyaan}
                    </h2>
                    
                    {/* Pilihan Jawaban */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(pertanyaan.pilihanJawaban).map(([key, pilihan]) => (
                        <motion.button
                          key={key}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleJawab(pilihan)}
                          className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                            jawabanDipilih === pilihan
                              ? 'border-red-500 bg-red-500 text-white shadow-lg'
                              : 'border-red-200 bg-red-50 hover:border-red-300 hover:bg-red-100'
                          }`}
                        >
                          <span className="font-semibold text-lg">{pilihan}</span>
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {jawabanDipilih && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center"
                    >
                      <div className="inline-flex items-center space-x-2 bg-green-100 px-4 py-2 rounded-full">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-green-700 font-medium">
                          Jawaban dipilih: {jawabanDipilih}
                        </span>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}

              {status === 'hasil' && hasil && (
                <motion.div
                  key="hasil"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white rounded-3xl shadow-xl p-8 border border-red-100"
                >
                  <div className="text-center">
                    <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 ${
                      hasil.isCorrect ? 'bg-green-500' : 'bg-red-500'
                    }`}>
                      {hasil.isCorrect ? (
                        <Trophy className="w-10 h-10 text-white" />
                      ) : (
                        <AlertCircle className="w-10 h-10 text-white" />
                      )}
                    </div>
                    
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">
                      {hasil.isCorrect ? 'Jawaban Benar! 🎉' : 'Jawaban Salah 😔'}
                    </h2>
                    
                    <div className="bg-gray-50 rounded-xl p-6 mb-8">
                      <div className="text-lg text-gray-700 mb-2">
                        <strong>Jawaban Kamu:</strong> {hasil.jawabanPeserta}
                      </div>
                      <div className="text-lg text-green-700">
                        <strong>Jawaban Benar:</strong> {hasil.jawabanBenar}
                      </div>
                    </div>

                    <button
                      onClick={handleLanjutkan}
                      className="bg-gradient-to-r from-red-500 to-red-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-red-600 hover:to-red-700 transition-all duration-200"
                    >
                      Lanjutkan ke Pertanyaan Berikutnya
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sidebar - Daftar Pemain */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl shadow-xl p-6 border border-red-100">
              <div className="flex items-center space-x-2 mb-6">
                <Users className="w-5 h-5 text-red-600" />
                <h3 className="font-semibold text-gray-900">Pemain Online</h3>
                <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full">
                  {pemainLain.length + 1}
                </span>
              </div>

              <div className="space-y-3">
                {/* Pemain saat ini */}
                <div className="flex items-center space-x-3 p-3 bg-red-50 rounded-xl">
                  <div className={`w-3 h-3 rounded-full ${pemainData.tim === 'merah' ? 'bg-red-500' : 'bg-gray-400'}`}></div>
                  <span className="font-medium text-gray-900">{pemainData.nama}</span>
                  <span className="text-xs text-gray-500">(Kamu)</span>
                </div>

                {/* Pemain lain yang terhubung real-time */}
                <AnimatePresence>
                  {pemainLain.map((pemain, index) => (
                    <motion.div
                      key={pemain.pemainId}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl"
                    >
                      <div className={`w-3 h-3 rounded-full ${pemain.tim === 'merah' ? 'bg-red-500' : 'bg-gray-400'}`}></div>
                      <span className="font-medium text-gray-900">{pemain.nama}</span>
                      <span className="text-xs text-gray-500">({pemain.tim})</span>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {pemainLain.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-4 text-gray-500"
                  >
                    <p>Belum ada pemain lain</p>
                    <p className="text-xs mt-1">Menunggu pemain lain bergabung...</p>
                  </motion.div>
                )}
              </div>

              {/* Status Game */}
              <div className="mt-6 p-4 bg-gradient-to-r from-red-50 to-red-100 rounded-xl">
                <div className="flex items-center space-x-2 mb-2">
                  <Zap className="w-4 h-4 text-red-600" />
                  <span className="font-semibold text-red-700">Status Game</span>
                </div>
                <div className="text-sm text-red-600">
                  {status === 'menunggu' && 'Menunggu pertanyaan dari Game Master'}
                  {status === 'pertanyaan' && 'Sedang menjawab pertanyaan'}
                  {status === 'hasil' && 'Menampilkan hasil'}
                </div>
              </div>

              {/* Connection Info */}
              <div className="mt-4 p-3 bg-blue-50 rounded-xl">
                <div className="flex items-center space-x-2 mb-2">
                  <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="text-sm font-medium text-blue-700">
                    {isConnected ? 'Socket Terhubung' : 'Socket Terputus'}
                  </span>
                </div>
                <p className="text-xs text-blue-600">
                  {isConnected 
                    ? 'Siap menerima update real-time'
                    : 'Mencoba menghubungkan...'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 