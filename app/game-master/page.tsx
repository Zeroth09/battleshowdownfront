'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Clock, 
  Trophy, 
  Eye, 
  Play,
  Pause,
  Square,
  Zap,
  Search,
  Filter,
  RefreshCw,
  Shuffle,
  Send,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { useRouter } from 'next/navigation';
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
  digunakan: number;
  tingkatKeberhasilan: number;
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

export default function GameMasterPage() {
  const [pertanyaanList, setPertanyaanList] = useState<Pertanyaan[]>([]);
  const [pertanyaanFiltered, setPertanyaanFiltered] = useState<Pertanyaan[]>([]);
  const [pemainOnline, setPemainOnline] = useState<Pemain[]>([]);
  const [pertanyaanAktif, setPertanyaanAktif] = useState<Battle | null>(null);
  const [waktuTersisa, setWaktuTersisa] = useState(0);
  const [statusGame, setStatusGame] = useState<'idle' | 'playing' | 'paused'>('idle');
  const [isConnected, setIsConnected] = useState(false);
  const [currentBattleId, setCurrentBattleId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedKategori, setSelectedKategori] = useState<string>('semua');
  const [selectedTingkat, setSelectedTingkat] = useState<string>('semua');
  const [selectedPertanyaan, setSelectedPertanyaan] = useState<Pertanyaan | null>(null);
  const [isSendingQuestion, setIsSendingQuestion] = useState(false);
  
  const router = useRouter();
  const socketRef = useRef<SocketManagerRef>(null);

  // Mock user data untuk game master (nanti bisa dari auth)
  const gameMasterUser = {
    pemainId: 'game-master-001',
    nama: 'Game Master',
    tim: 'merah' as const
  };

  const handleReady = () => {
    console.log('✅ Socket ready for Game Master');
    setIsConnected(true);
    loadPertanyaan();
  };

  const handleBattleStart = (battleData: Battle) => {
    console.log('⚔️ Battle started:', battleData);
    setPertanyaanAktif(battleData);
    setCurrentBattleId(battleData.id);
    setStatusGame('playing');
    setWaktuTersisa(30); // Default waktu
  };

  const handleBattleEnd = (result: any) => {
    console.log('🏁 Battle ended:', result);
    setStatusGame('idle');
    setPertanyaanAktif(null);
    setCurrentBattleId(null);
    setWaktuTersisa(0);
    setSelectedPertanyaan(null);
  };

  const handleLiveAnswer = (answerData: any) => {
    console.log('💬 Live answer received:', answerData);
    // Handle live answer updates
  };

  const loadPertanyaan = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/pertanyaan');
      if (response.ok) {
        const data = await response.json();
        setPertanyaanList(data.data || []);
        setPertanyaanFiltered(data.data || []);
      }
    } catch (error) {
      console.error('Error loading pertanyaan:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPertanyaanRandom = async () => {
    try {
      const response = await fetch('/api/pertanyaan/random');
      if (response.ok) {
        const data = await response.json();
        if (data.sukses && data.data) {
          setSelectedPertanyaan(data.data);
          // Auto-scroll to selected question
          const element = document.getElementById(`pertanyaan-${data.data._id}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
      }
    } catch (error) {
      console.error('Error getting random pertanyaan:', error);
    }
  };

  const handleKirimPertanyaan = async () => {
    if (!selectedPertanyaan) {
      alert('Pilih pertanyaan terlebih dahulu!');
      return;
    }

    if (!socketRef.current || !isConnected) {
      alert('Socket belum terhubung!');
      return;
    }

    try {
      setIsSendingQuestion(true);
      
      // Trigger global battle via socket
      const battleData = {
        battleData: {
          id: `battle_${Date.now()}`,
          pertanyaan: selectedPertanyaan.pertanyaan,
          pilihanJawaban: selectedPertanyaan.pilihanJawaban,
          jawabanBenar: selectedPertanyaan.pilihanJawaban[selectedPertanyaan.jawabanBenar as keyof typeof selectedPertanyaan.pilihanJawaban],
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
      
      // Update status pertanyaan
      setPertanyaanAktif(battleData.battleData);
      setCurrentBattleId(battleData.battleData.id);
      setStatusGame('playing');
      setWaktuTersisa(30);
      
    } catch (error) {
      console.error('Error sending pertanyaan:', error);
      alert('Gagal mengirim pertanyaan!');
    } finally {
      setIsSendingQuestion(false);
    }
  };

  const handleStopGame = async () => {
    if (!socketRef.current || !currentBattleId) return;

    try {
      // End battle via socket
      socketRef.current.socket?.emit('game-master-end-battle', {
        result: { message: 'Battle dihentikan oleh Game Master' },
        gameMasterId: gameMasterUser.pemainId
      });

      setStatusGame('idle');
      setPertanyaanAktif(null);
      setCurrentBattleId(null);
      setWaktuTersisa(0);
      setSelectedPertanyaan(null);
    } catch (error) {
      console.error('Error stopping battle:', error);
    }
  };

  // Filter pertanyaan berdasarkan search dan filter
  useEffect(() => {
    let filtered = pertanyaanList;
    
    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.pertanyaan.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.kategori.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (selectedKategori !== 'semua') {
      filtered = filtered.filter(p => p.kategori === selectedKategori);
    }
    
    if (selectedTingkat !== 'semua') {
      filtered = filtered.filter(p => p.tingkatKesulitan === selectedTingkat);
    }
    
    setPertanyaanFiltered(filtered);
  }, [pertanyaanList, searchTerm, selectedKategori, selectedTingkat]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (statusGame === 'playing' && waktuTersisa > 0) {
      interval = setInterval(() => {
        setWaktuTersisa(prev => {
          if (prev <= 1) {
            // Waktu habis, game selesai
            handleStopGame();
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
        user={gameMasterUser}
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
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Game Master Panel</h1>
                <p className="text-sm text-gray-500">Kontrol pertanyaan dan gameplay realtime</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={getPertanyaanRandom}
                disabled={!isConnected || statusGame === 'playing'}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-colors ${
                  !isConnected || statusGame === 'playing'
                    ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                    : 'bg-purple-500 text-white hover:bg-purple-600'
                }`}
              >
                <Shuffle className="w-4 h-4" />
                <span>Random</span>
              </button>
              <button
                onClick={loadPertanyaan}
                disabled={isLoading}
                className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-xl hover:bg-blue-600 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Daftar Pertanyaan */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header Section */}
            <div className="bg-white rounded-3xl shadow-xl p-6 border border-red-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Daftar Pertanyaan ({pertanyaanFiltered.length})
                </h2>
              </div>

              {/* Search dan Filter */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Cari pertanyaan..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border-2 border-red-200 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all duration-200"
                  />
                </div>
                
                <select
                  value={selectedKategori}
                  onChange={(e) => setSelectedKategori(e.target.value)}
                  className="px-4 py-2 border-2 border-red-200 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all duration-200"
                >
                  <option value="semua">Semua Kategori</option>
                  <option value="umum">Umum</option>
                  <option value="sejarah">Sejarah</option>
                  <option value="sains">Sains</option>
                  <option value="teknologi">Teknologi</option>
                  <option value="olahraga">Olahraga</option>
                  <option value="hiburan">Hiburan</option>
                  <option value="geografi">Geografi</option>
                  <option value="matematika">Matematika</option>
                  <option value="sastra">Sastra</option>
                  <option value="seni">Seni</option>
                  <option value="ekonomi">Ekonomi</option>
                  <option value="politik">Politik</option>
                </select>
                
                <select
                  value={selectedTingkat}
                  onChange={(e) => setSelectedTingkat(e.target.value)}
                  className="px-4 py-2 border-2 border-red-200 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all duration-200"
                >
                  <option value="semua">Semua Tingkat</option>
                  <option value="mudah">Mudah</option>
                  <option value="sedang">Sedang</option>
                  <option value="sulit">Sulit</option>
                </select>
              </div>
            </div>

            {/* Daftar Pertanyaan */}
            <div className="bg-white rounded-3xl shadow-xl p-6 border border-red-100">
              {isLoading ? (
                <div className="text-center py-12">
                  <RefreshCw className="w-8 h-8 text-red-500 animate-spin mx-auto mb-4" />
                  <p className="text-gray-500">Memuat pertanyaan...</p>
                </div>
              ) : pertanyaanFiltered.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p>Tidak ada pertanyaan yang sesuai dengan filter.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pertanyaanFiltered.map((pertanyaanItem) => (
                    <motion.div
                      key={pertanyaanItem._id}
                      id={`pertanyaan-${pertanyaanItem._id}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`border-2 rounded-xl p-4 transition-all duration-200 cursor-pointer ${
                        selectedPertanyaan?._id === pertanyaanItem._id
                          ? 'border-red-500 bg-red-50 shadow-lg'
                          : 'border-red-100 hover:border-red-200'
                      }`}
                      onClick={() => setSelectedPertanyaan(pertanyaanItem)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-2">{pertanyaanItem.pertanyaan}</h3>
                          
                          {/* Pilihan Jawaban */}
                          <div className="grid grid-cols-2 gap-2 mb-3">
                            {Object.entries(pertanyaanItem.pilihanJawaban).map(([key, value]) => (
                              <div key={key} className="text-sm text-gray-600 flex items-center">
                                <span className="font-medium mr-2">{key.toUpperCase()}.</span>
                                <span>{value}</span>
                                {key === pertanyaanItem.jawabanBenar && (
                                  <span className="ml-2 text-green-600 font-semibold">✓</span>
                                )}
                              </div>
                            ))}
                          </div>
                          
                          {/* Info tambahan */}
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full">
                              {pertanyaanItem.kategori}
                            </span>
                            <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                              {pertanyaanItem.tingkatKesulitan}
                            </span>
                            <span>Digunakan: {pertanyaanItem.digunakan}x</span>
                            <span>Sukses: {pertanyaanItem.tingkatKeberhasilan.toFixed(1)}%</span>
                          </div>
                        </div>
                        
                        <div className="ml-4">
                          {selectedPertanyaan?._id === pertanyaanItem._id ? (
                            <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                              <CheckCircle className="w-4 h-4 text-white" />
                            </div>
                          ) : (
                            <div className="w-6 h-6 border-2 border-gray-300 rounded-full"></div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - Status Game & Kontrol */}
          <div className="lg:col-span-1 space-y-6">
            {/* Main Action Button */}
            <div className="bg-white rounded-3xl shadow-xl p-6 border border-red-100">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <Send className="w-5 h-5 text-red-600 mr-2" />
                Kirim Pertanyaan
              </h3>
              
              {!selectedPertanyaan ? (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-2">Belum ada pertanyaan dipilih</p>
                  <p className="text-xs text-gray-400">Pilih pertanyaan dari daftar di sebelah kiri</p>
                </div>
              ) : (
                <div className="text-center">
                  <div className="bg-red-100 rounded-2xl p-4 mb-4">
                    <h4 className="font-semibold text-gray-900 mb-2 text-sm">
                      Pertanyaan Terpilih:
                    </h4>
                    <p className="text-sm text-gray-600">
                      {selectedPertanyaan.pertanyaan.substring(0, 60)}...
                    </p>
                    <div className="flex items-center justify-center space-x-2 mt-2">
                      <span className="bg-red-200 text-red-700 px-2 py-1 rounded-full text-xs">
                        {selectedPertanyaan.kategori}
                      </span>
                      <span className="bg-blue-200 text-blue-700 px-2 py-1 rounded-full text-xs">
                        {selectedPertanyaan.tingkatKesulitan}
                      </span>
                    </div>
                  </div>
                  
                  <button
                    onClick={handleKirimPertanyaan}
                    disabled={!isConnected || statusGame === 'playing' || isSendingQuestion}
                    className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all duration-200 ${
                      !isConnected || statusGame === 'playing' || isSendingQuestion
                        ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                        : 'bg-red-500 text-white hover:bg-red-600 hover:scale-105 shadow-lg'
                    }`}
                  >
                    {isSendingQuestion ? (
                      <div className="flex items-center justify-center space-x-2">
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        <span>Mengirim...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center space-x-2">
                        <Send className="w-5 h-5" />
                        <span>Kirim Pertanyaan!</span>
                      </div>
                    )}
                  </button>
                  
                  <p className="text-xs text-gray-500 mt-3">
                    Pertanyaan akan dikirim ke semua peserta secara realtime
                  </p>
                </div>
              )}
            </div>

            {/* Status Game */}
            <div className="bg-white rounded-3xl shadow-xl p-6 border border-red-100">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <Clock className="w-5 h-5 text-red-600 mr-2" />
                Status Game
              </h3>
              
              {statusGame === 'idle' ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Square className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500">Game belum dimulai</p>
                  <p className="text-xs text-gray-400 mt-2">Pilih pertanyaan dan klik Kirim</p>
                </div>
              ) : (
                <div className="text-center">
                  <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Play className="w-8 h-8 text-red-600" />
                  </div>
                  
                  <h4 className="font-semibold text-gray-900 mb-2 text-sm">
                    {pertanyaanAktif?.pertanyaan?.substring(0, 50)}...
                  </h4>
                  
                  <div className="text-3xl font-bold text-red-600 mb-4">
                    {waktuTersisa}s
                  </div>
                  
                  <button
                    onClick={handleStopGame}
                    className="w-full bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition-colors"
                  >
                    Stop Game
                  </button>
                </div>
              )}
            </div>

            {/* Connection Status */}
            <div className="bg-white rounded-3xl shadow-xl p-6 border border-red-100">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <Zap className="w-5 h-5 text-red-600 mr-2" />
                Status Koneksi
              </h3>
              
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className={`text-sm ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                  {isConnected ? 'Terhubung' : 'Tidak Terhubung'}
                </span>
              </div>
              
              <p className="text-xs text-gray-500 mt-2">
                {isConnected 
                  ? 'Socket terhubung, siap mengirim pertanyaan'
                  : 'Menunggu koneksi socket...'
                }
              </p>
            </div>

            {/* Info Panel */}
            <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-3xl p-6 border border-red-200">
              <h3 className="font-semibold text-red-900 mb-3">📋 Cara Kerja</h3>
              <div className="space-y-2 text-sm text-red-800">
                <p>1. Pilih pertanyaan dari daftar</p>
                <p>2. Klik "Kirim Pertanyaan"</p>
                <p>3. Peserta akan menerima pertanyaan realtime</p>
                <p>4. Monitor jawaban dan hasil battle</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 