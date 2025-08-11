'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Eye, 
  Users, 
  Clock, 
  Trophy, 
  ArrowLeft,
  TrendingUp,
  BarChart3,
  Target,
  Zap
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import SocketManager, { SocketManagerRef } from '../../components/SocketManager';

interface Pemain {
  id: string;
  nama: string;
  tim: string;
  skor: number;
  status: 'online' | 'offline';
  jawabanTerakhir?: string;
  waktuJawab?: number;
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

interface StatistikTim {
  merah: {
    totalSkor: number;
    pemainCount: number;
    rataRataSkor: number;
    jawabanBenar: number;
  };
  putih: {
    totalSkor: number;
    pemainCount: number;
    rataRataSkor: number;
    jawabanBenar: number;
  };
}

interface HasilPertanyaan {
  jawabanBenar: string;
  skorTim: { merah: number; putih: number };
  pemenang: string;
  statistikJawaban: Record<string, number>;
}

export default function SpectatorPage() {
  const [pemain, setPemain] = useState<Pemain[]>([]);
  const [pertanyaanAktif, setPertanyaanAktif] = useState<Battle | null>(null);
  const [statusGame, setStatusGame] = useState<'menunggu' | 'pertanyaan' | 'hasil'>('menunggu');
  const [waktuTersisa, setWaktuTersisa] = useState(0);
  const [statistikTim, setStatistikTim] = useState<StatistikTim>({
    merah: { totalSkor: 0, pemainCount: 0, rataRataSkor: 0, jawabanBenar: 0 },
    putih: { totalSkor: 0, pemainCount: 0, rataRataSkor: 0, jawabanBenar: 0 }
  });
  const [hasilPertanyaan, setHasilPertanyaan] = useState<HasilPertanyaan | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [liveAnswers, setLiveAnswers] = useState<any[]>([]);
  const router = useRouter();
  const socketRef = useRef<SocketManagerRef>(null);

  // Mock user data untuk spectator (nanti bisa dari auth)
  const spectatorUser = {
    pemainId: 'spectator-001',
    nama: 'Spectator',
    tim: 'merah' as const
  };

  const handleReady = () => {
    console.log('✅ Socket ready for Spectator');
    setIsConnected(true);
  };

  const handleBattleStart = (battleData: Battle) => {
    console.log('⚔️ Battle started:', battleData);
    setPertanyaanAktif(battleData);
    setStatusGame('pertanyaan');
    setWaktuTersisa(30); // Default waktu
    setLiveAnswers([]);
    setHasilPertanyaan(null);
  };

  const handleBattleEnd = (result: any) => {
    console.log('🏁 Battle finished:', result);
    setStatusGame('hasil');
    setPertanyaanAktif(null);
    
    // Buat hasil pertanyaan dari live answers
    if (liveAnswers.length > 0) {
      const statistikJawaban: Record<string, number> = {};
      liveAnswers.forEach(answer => {
        statistikJawaban[answer.jawaban] = (statistikJawaban[answer.jawaban] || 0) + 1;
      });

      setHasilPertanyaan({
        jawabanBenar: result.jawabanBenar,
        skorTim: { merah: 0, putih: 0 }, // Nanti bisa dihitung dari live answers
        pemenang: result.pemenang?.tim || 'merah',
        statistikJawaban
      });
    }
  };

  const handleLiveAnswer = (answerData: any) => {
    console.log('👁️ Live answer received:', answerData);
    setLiveAnswers(prev => [...prev, answerData]);
    
    // Update statistik tim
    setStatistikTim(prev => {
      const tim = answerData.tim;
      const isCorrect = answerData.jawaban === pertanyaanAktif?.jawabanBenar;
      
      if (tim === 'merah') {
        return {
          ...prev,
          merah: {
            ...prev.merah,
            jawabanBenar: prev.merah.jawabanBenar + (isCorrect ? 1 : 0),
            totalSkor: prev.merah.totalSkor + (isCorrect ? 10 : 0)
          }
        };
      } else {
        return {
          ...prev,
          putih: {
            ...prev.putih,
            jawabanBenar: prev.putih.jawabanBenar + (isCorrect ? 1 : 0),
            totalSkor: prev.putih.totalSkor + (isCorrect ? 10 : 0)
          }
        };
      }
    });
  };

  const handleLanjutkan = () => {
    setStatusGame('menunggu');
    setPertanyaanAktif(null);
    setHasilPertanyaan(null);
    setLiveAnswers([]);
  };

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (statusGame === 'pertanyaan' && waktuTersisa > 0) {
      interval = setInterval(() => {
        setWaktuTersisa(prev => {
          if (prev <= 1) {
            // Waktu habis, game selesai
            setStatusGame('hasil');
            return 0;
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
        user={spectatorUser}
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
              <button
                onClick={() => router.push('/game-master')}
                className="p-2 hover:bg-red-50 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-red-600" />
              </button>
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center">
                <Eye className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Spectator Mode</h1>
                <p className="text-sm text-gray-500">Lihat game dari sisi penonton</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className={`flex items-center space-x-2 ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm font-medium">
                  {isConnected ? 'Terhubung' : 'Terputus'}
                </span>
              </div>
              <span className="text-sm text-gray-500">Live View</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content - Game Status */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {statusGame === 'menunggu' && (
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
                    <p className="text-gray-600">
                      Game Master sedang menyiapkan pertanyaan berikutnya...
                    </p>
                  </div>
                </motion.div>
              )}

              {statusGame === 'pertanyaan' && pertanyaanAktif && (
                <motion.div
                  key="pertanyaan"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white rounded-3xl shadow-xl p-8 border border-red-100"
                >
                  {/* Timer */}
                  <div className="text-center mb-6">
                    <div className="inline-flex items-center space-x-2 bg-red-100 px-6 py-3 rounded-full">
                      <Clock className="w-5 h-5 text-red-600" />
                      <span className="text-red-700 font-bold text-2xl">
                        {waktuTersisa}s
                      </span>
                    </div>
                  </div>

                  {/* Pertanyaan */}
                  <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-gray-900 mb-8">
                      {pertanyaanAktif.pertanyaan}
                    </h2>
                    
                    {/* Pilihan Jawaban */}
                    <div className="grid grid-cols-2 gap-4">
                      {Object.entries(pertanyaanAktif.pilihanJawaban).map(([key, pilihan]) => (
                        <div
                          key={key}
                          className={`p-6 rounded-xl border-2 transition-all duration-200 ${
                            pilihan === pertanyaanAktif.jawabanBenar
                              ? 'border-green-500 bg-green-50'
                              : 'border-red-200 bg-red-50'
                          }`}
                        >
                          <span className="font-semibold text-lg text-gray-900">
                            {key.toUpperCase()}. {pilihan}
                          </span>
                          {pilihan === pertanyaanAktif.jawabanBenar && (
                            <div className="mt-2 text-green-600 font-bold">✓ Jawaban Benar</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Live Answers */}
                  {liveAnswers.length > 0 && (
                    <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
                      <h3 className="font-semibold text-blue-900 mb-3">Jawaban Live ({liveAnswers.length})</h3>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {liveAnswers.slice(-5).map((answer, index) => (
                          <div key={index} className="flex items-center justify-between text-sm">
                            <span className="text-blue-800">{answer.nama}</span>
                            <span className="text-blue-600">{answer.jawaban}</span>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              answer.jawaban === pertanyaanAktif?.jawabanBenar
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {answer.jawaban === pertanyaanAktif?.jawabanBenar ? '✓' : '✗'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {statusGame === 'hasil' && hasilPertanyaan && (
                <motion.div
                  key="hasil"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white rounded-3xl shadow-xl p-8 border border-red-100"
                >
                  <div className="text-center">
                    <h2 className="text-3xl font-bold text-gray-900 mb-6">
                      Hasil Pertanyaan
                    </h2>
                    
                    {/* Statistik Jawaban */}
                    <div className="grid grid-cols-2 gap-6 mb-8">
                      {Object.entries(hasilPertanyaan.statistikJawaban).map(([jawaban, count]) => (
                        <div
                          key={jawaban}
                          className={`p-4 rounded-xl border-2 ${
                            jawaban === hasilPertanyaan.jawabanBenar
                              ? 'border-green-500 bg-green-50'
                              : 'border-red-200 bg-red-50'
                          }`}
                        >
                          <div className="text-2xl font-bold text-gray-900 mb-1">
                            {count} pemain
                          </div>
                          <div className="text-sm text-gray-600">{jawaban}</div>
                          {jawaban === hasilPertanyaan.jawabanBenar && (
                            <div className="text-green-600 font-semibold text-sm mt-1">✓ Benar</div>
                          )}
                        </div>
                      ))}
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

          {/* Sidebar - Statistik & Pemain */}
          <div className="lg:col-span-2 space-y-6">
            {/* Connection Status */}
            <div className="bg-white rounded-3xl shadow-xl p-6 border border-red-100">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <Zap className="w-5 h-5 text-red-600 mr-2" />
                Status Koneksi
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <span className="font-medium text-gray-900">Socket Status</span>
                  <div className={`flex items-center space-x-2 ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="text-sm font-medium">
                      {isConnected ? 'Terhubung' : 'Terputus'}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <span className="font-medium text-gray-900">Game Status</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    statusGame === 'menunggu' ? 'bg-gray-100 text-gray-700' :
                    statusGame === 'pertanyaan' ? 'bg-green-100 text-green-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {statusGame === 'menunggu' ? 'Menunggu' : 
                     statusGame === 'pertanyaan' ? 'Pertanyaan' : 'Hasil'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <span className="font-medium text-gray-900">Live Answers</span>
                  <span className="text-sm font-medium text-blue-600">{liveAnswers.length}</span>
                </div>
              </div>
            </div>

            {/* Statistik Tim */}
            <div className="bg-white rounded-3xl shadow-xl p-6 border border-red-100">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <BarChart3 className="w-5 h-5 text-red-600 mr-2" />
                Statistik Tim
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                {/* Tim Merah */}
                <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="font-semibold text-red-700">Tim Merah</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Pemain:</span>
                      <span className="font-semibold">{statistikTim.merah.pemainCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Skor:</span>
                      <span className="font-semibold">{statistikTim.merah.totalSkor}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Rata-rata:</span>
                      <span className="font-semibold">{statistikTim.merah.rataRataSkor}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Jawaban Benar:</span>
                      <span className="font-semibold">{statistikTim.merah.jawabanBenar}</span>
                    </div>
                  </div>
                </div>

                {/* Tim Putih */}
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                    <span className="font-semibold text-gray-700">Tim Putih</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Pemain:</span>
                      <span className="font-semibold">{statistikTim.putih.pemainCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Skor:</span>
                      <span className="font-semibold">{statistikTim.putih.totalSkor}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Rata-rata:</span>
                      <span className="font-semibold">{statistikTim.putih.rataRataSkor}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Jawaban Benar:</span>
                      <span className="font-semibold">{statistikTim.putih.jawabanBenar}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pemenang */}
              {hasilPertanyaan && (
                <div className="mt-4 p-4 bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-xl border border-yellow-200">
                  <div className="flex items-center justify-center space-x-2">
                    <Trophy className="w-5 h-5 text-yellow-600" />
                    <span className="font-semibold text-yellow-700">
                      Tim {hasilPertanyaan.pemenang === 'merah' ? 'Merah' : 'Putih'} Menang!
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Info Spectator */}
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-3xl p-6 border border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-3">👁️ Mode Spectator</h3>
              <div className="space-y-2 text-sm text-blue-800">
                <p>• Lihat pertanyaan secara realtime</p>
                <p>• Monitor jawaban pemain live</p>
                <p>• Statistik tim realtime</p>
                <p>• Tidak bisa ikut bermain</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 