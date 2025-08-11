'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Clock, Trophy, X, CheckCircle, XCircle } from 'lucide-react';
import dynamic from 'next/dynamic';
import ErrorBoundary from '../../components/ErrorBoundary';

// Dynamic import SocketManager dengan error handling
const SocketManager = dynamic(() => import('../../components/SocketManager'), {
  ssr: false,
  loading: () => (
    <div className="fixed bottom-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg">
      Menghubungkan ke server...
    </div>
  )
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

const LombaPageContent = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeBattle, setActiveBattle] = useState<Battle | null>(null);
  const [battleStatus, setBattleStatus] = useState<string>('Menunggu Pertanyaan');
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [isAnswering, setIsAnswering] = useState<boolean>(false);
  const [lobbyPlayers, setLobbyPlayers] = useState<User[]>([]);
  const [error, setError] = useState<string>('');
  const [showResult, setShowResult] = useState<boolean>(false);
  const [resultMessage, setResultMessage] = useState<string>('');
  const [resultType, setResultType] = useState<'win' | 'lose' | ''>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  const socketManagerRef = useRef<any>(null);
  const [socketManagerReady, setSocketManagerReady] = useState<boolean>(false);
  const [socketManagerInstance, setSocketManagerInstance] = useState<any>(null);

  // Load user data from localStorage with error handling
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
      } else {
        // Create default user if none exists
        const defaultUser: User = {
          pemainId: `player_${Date.now()}`,
          nama: `Peserta ${Math.floor(Math.random() * 1000)}`,
          tim: Math.random() > 0.5 ? 'merah' : 'putih'
        };
        setUser(defaultUser);
        localStorage.setItem('user', JSON.stringify(defaultUser));
      }
    } catch (error) {
      console.error('Error loading user:', error);
      // Fallback user
      const fallbackUser: User = {
        pemainId: `player_${Date.now()}`,
        nama: 'Peserta',
        tim: 'merah'
      };
      setUser(fallbackUser);
      localStorage.setItem('user', JSON.stringify(fallbackUser));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleBattleStart = useCallback((battleData: Battle) => {
    try {
      console.log('🎯 Battle started for participant:', battleData);
      setActiveBattle(battleData);
      setBattleStatus('Pertanyaan Aktif!');
      setSelectedAnswer('');
      setIsAnswering(false);
      setShowResult(false);
      setResultMessage('');
      setResultType('');
      setError(''); // Clear any previous errors
    } catch (error) {
      console.error('Error in handleBattleStart:', error);
      setError('Error memulai battle');
    }
  }, []);

  const handleBattleEnd = useCallback((result: any) => {
    try {
      console.log('🏁 Battle ended for participant:', result);
      
      if (result && result.pemenang) {
        const isWinner = result.pemenang.pemainId === user?.pemainId;
        const isCorrect = result.jawabanBenar === result.jawabanPeserta;
        
        if (isWinner && isCorrect) {
          setResultMessage('🏆 LANJUTKAN PERJALANAN!');
          setResultType('win');
        } else if (isWinner && !isCorrect) {
          setResultMessage('💔 ULANGI DARI AWAL!');
          setResultType('lose');
        } else {
          setResultMessage('💔 ULANGI DARI AWAL!');
          setResultType('lose');
        }
      }
      
      setShowResult(true);
      setBattleStatus('Menunggu Pertanyaan');
      
      // Auto clear after 5 seconds
      setTimeout(() => {
        setActiveBattle(null);
        setShowResult(false);
        setResultMessage('');
        setResultType('');
      }, 5000);
    } catch (error) {
      console.error('Error in handleBattleEnd:', error);
      setError('Error mengakhiri battle');
    }
  }, [user]);

  const handleSubmitAnswer = useCallback(async (answer: string) => {
    if (!user || !activeBattle || isAnswering) return;
    
    try {
      setIsAnswering(true);
      setSelectedAnswer(answer);
      setError(''); // Clear previous errors
      
      // Get submitAnswer function from socket manager
      let submitAnswer = null;
      if (socketManagerRef.current?.submitAnswer) {
        submitAnswer = socketManagerRef.current.submitAnswer;
      } else if (socketManagerInstance?.submitAnswer) {
        submitAnswer = socketManagerInstance.submitAnswer;
      } else if ((window as any).socket?.submitAnswer) {
        submitAnswer = (window as any).socket.submitAnswer;
      }
      
      if (submitAnswer) {
        await submitAnswer(activeBattle.id, answer);
        console.log('✅ Answer submitted:', answer);
      } else {
        console.error('❌ submitAnswer function not available');
        setError('Error submitting answer - coba refresh halaman');
      }
    } catch (error) {
      console.error('❌ Error submitting answer:', error);
      setError('Error submitting answer - coba refresh halaman');
    } finally {
      setIsAnswering(false);
    }
  }, [user, activeBattle, isAnswering, socketManagerInstance]);

  const handleSocketReady = useCallback(() => {
    try {
      setSocketManagerReady(true);
      console.log('✅ Socket manager ready');
    } catch (error) {
      console.error('Error in handleSocketReady:', error);
    }
  }, []);

  const handleSocketManagerRef = useCallback((ref: any) => {
    try {
      socketManagerRef.current = ref;
      if (ref) {
        setSocketManagerInstance(ref);
        console.log('✅ Socket manager ref set');
      }
    } catch (error) {
      console.error('Error setting socket manager ref:', error);
    }
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Memuat data peserta...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold mb-2">Error Loading User</h2>
          <p className="text-gray-300 mb-4">Gagal memuat data peserta</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-lg"
          >
            Refresh Halaman
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Lomba Battle</h1>
                <p className="text-sm text-gray-300">Peserta</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                user.tim === 'merah' 
                  ? 'bg-red-500/20 text-red-200 border border-red-500/30' 
                  : 'bg-white/20 text-white border border-white/30'
              }`}>
                Tim {user.tim.charAt(0).toUpperCase() + user.tim.slice(1)}
              </div>
              <div className="text-white text-sm">
                {user.nama}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Status */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-white/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Clock className="w-6 h-6 text-yellow-400" />
              <div>
                <h2 className="text-lg font-semibold text-white">{battleStatus}</h2>
                <p className="text-sm text-gray-300">Siap menjawab pertanyaan</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 text-sm text-gray-300">
              <Users className="w-4 h-4" />
              <span>{lobbyPlayers.length} peserta online</span>
            </div>
          </div>
        </div>

        {/* Waiting Room */}
        {!activeBattle && !showResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20"
          >
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="w-10 h-10 text-white" />
              </div>
              
              <h2 className="text-2xl font-bold text-white mb-4">
                Menunggu Pertanyaan
              </h2>
              
              <p className="text-gray-300 mb-6">
                Bersiaplah! Game Master akan memulai pertanyaan segera.
              </p>
              
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-400">
                <div className={`w-2 h-2 rounded-full ${socketManagerReady ? 'bg-green-400' : 'bg-yellow-400'} animate-pulse`}></div>
                <span>{socketManagerReady ? 'Terhubung ke server' : 'Menghubungkan...'}</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Question Modal */}
        <AnimatePresence>
          {activeBattle && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl"
              >
                <div className="text-center mb-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-2">
                    Pertanyaan
                  </h2>
                  <p className="text-gray-600">
                    Jawab dengan cepat dan benar!
                  </p>
                </div>

                <div className="mb-6">
                  <p className="text-lg font-medium text-gray-800 mb-4">
                    {activeBattle.pertanyaan}
                  </p>
                </div>

                <div className="space-y-3">
                  {Object.entries(activeBattle.pilihanJawaban).map(([key, value]) => (
                    <button
                      key={key}
                      onClick={() => handleSubmitAnswer(key)}
                      disabled={isAnswering}
                      className={`w-full p-4 rounded-xl text-left transition-all duration-200 ${
                        selectedAnswer === key
                          ? 'bg-blue-500 text-white shadow-lg'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                      } ${isAnswering ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">
                          {key.toUpperCase()}. {value}
                        </span>
                        {selectedAnswer === key && (
                          <CheckCircle className="w-5 h-5" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                {isAnswering && (
                  <div className="mt-4 text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="text-sm text-gray-500 mt-2">Mengirim jawaban...</p>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Result Modal */}
        <AnimatePresence>
          {showResult && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl text-center"
              >
                <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${
                  resultType === 'win' 
                    ? 'bg-green-500' 
                    : 'bg-red-500'
                }`}>
                  {resultType === 'win' ? (
                    <Trophy className="w-10 h-10 text-white" />
                  ) : (
                    <XCircle className="w-10 h-10 text-white" />
                  )}
                </div>

                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  {resultType === 'win' ? 'MENANG!' : 'KALAH!'}
                </h2>

                <p className="text-lg font-medium text-gray-600 mb-6">
                  {resultMessage}
                </p>

                <div className="text-sm text-gray-500">
                  Menunggu pertanyaan berikutnya...
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 mb-4"
          >
            <div className="flex items-center justify-between">
              <p className="text-red-200">{error}</p>
              <button 
                onClick={() => setError('')}
                className="text-red-300 hover:text-red-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Socket Manager with Error Boundary */}
      {user && (
        <div className="relative">
          <SocketManager
            ref={handleSocketManagerRef}
            user={user}
            onReady={handleSocketReady}
            onBattleStart={handleBattleStart}
            onBattleEnd={handleBattleEnd}
          />
        </div>
      )}
    </div>
  );
};

const LombaPage = () => {
  return (
    <ErrorBoundary>
      <LombaPageContent />
    </ErrorBoundary>
  );
};

export default LombaPage; 