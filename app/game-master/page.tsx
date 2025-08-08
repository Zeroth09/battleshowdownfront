'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Crown, Users, Radio, Trophy, Eye, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import SocketManager from '../../components/SocketManager';

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

const GameMasterPage: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [lobbyPlayers, setLobbyPlayers] = useState<User[]>([]);
  const [battleStatus, setBattleStatus] = useState<string>('Menunggu Peserta');
  const [isTriggering, setIsTriggering] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [connectedCount, setConnectedCount] = useState<number>(0);
  
  const socketManagerRef = useRef<any>(null);
  const [socketManagerReady, setSocketManagerReady] = useState<boolean>(false);

  // Load or create Game Master user
  useEffect(() => {
    const gameMasterId = localStorage.getItem('gameMasterId');
    if (gameMasterId) {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        if (userData.pemainId === gameMasterId) {
          setUser(userData);
          return;
        }
      }
    }

    // Create Game Master user
    const gameMasterUser: User = {
      pemainId: `gm_${Date.now()}`,
      nama: 'Game Master',
      tim: 'merah' // Default team for GM
    };
    
    setUser(gameMasterUser);
    localStorage.setItem('user', JSON.stringify(gameMasterUser));
    localStorage.setItem('gameMasterId', gameMasterUser.pemainId);
  }, []);

  const triggerQuestionForAll = async () => {
    if (!user || isTriggering) return;

    setIsTriggering(true);
    setBattleStatus('Memulai Pertanyaan untuk Semua Peserta...');

    try {
      // Simulate question for all participants
      setTimeout(() => {
        const mockBattle: Battle = {
          id: `question_${Date.now()}`,
          pertanyaan: 'Apa ibukota Indonesia?',
          pilihanJawaban: {
            a: 'Jakarta',
            b: 'Bandung',
            c: 'Surabaya',
            d: 'Medan'
          },
          jawabanBenar: 'Jakarta',
          lawan: {
            nama: 'Tim Lawan',
            tim: 'lawan'
          }
        };

        // Emit global battle event to all participants
        if (socketManagerRef.current?.socket && user) {
          socketManagerRef.current.socket.emit('game-master-trigger-battle', {
            battleData: mockBattle,
            gameMasterId: user.pemainId
          });
          console.log('🎯 Game Master triggered global question');
        }

        setBattleStatus('Pertanyaan Dimulai untuk Semua Peserta!');
      }, 2000);

    } catch (error) {
      console.error('❌ Error triggering global question:', error);
      setError('Error triggering question');
      setBattleStatus('Menunggu Peserta');
    } finally {
      setIsTriggering(false);
    }
  };

  const handleSocketReady = () => {
    setSocketManagerReady(true);
  };

  const handleSocketManagerRef = (ref: any) => {
    socketManagerRef.current = ref;
  };

  const handleBattleStart = (battleData: Battle) => {
    console.log('🎯 Battle started by Game Master:', battleData);
    setBattleStatus('Pertanyaan Aktif!');
  };

  const handleBattleEnd = (result: any) => {
    console.log('🏁 Battle ended:', result);
    setBattleStatus('Menunggu Peserta');
  };

  // Mock lobby players for demo
  useEffect(() => {
    const mockPlayers: User[] = [
      { pemainId: 'p1', nama: 'Ahmad', tim: 'merah' },
      { pemainId: 'p2', nama: 'Budi', tim: 'putih' },
      { pemainId: 'p3', nama: 'Citra', tim: 'merah' },
      { pemainId: 'p4', nama: 'Dewi', tim: 'putih' },
      { pemainId: 'p5', nama: 'Eko', tim: 'merah' }
    ];
    setLobbyPlayers(mockPlayers);
    setConnectedCount(mockPlayers.length);
  }, []);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Memuat Game Master...</p>
        </div>
      </div>
    );
  }

  const merahPlayers = lobbyPlayers.filter(p => p.tim === 'merah');
  const putihPlayers = lobbyPlayers.filter(p => p.tim === 'putih');

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center">
                <Crown className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Game Master Panel</h1>
                <p className="text-sm text-gray-300">Kontrol Lomba Battle</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link 
                href="/spectator"
                className="flex items-center space-x-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
              >
                <Eye className="w-4 h-4" />
                <span>Spectator</span>
              </Link>
              
              <Link 
                href="/lomba"
                className="flex items-center space-x-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Peserta</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Game Master Controls */}
          <div className="lg:col-span-1">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Crown className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">Game Master</h2>
                <p className="text-sm text-gray-300">Kontrol pertanyaan untuk semua peserta</p>
              </div>

              {/* Status */}
              <div className="bg-black/20 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">Status:</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    battleStatus.includes('Aktif') 
                      ? 'bg-green-500/20 text-green-200 border border-green-500/30'
                      : 'bg-yellow-500/20 text-yellow-200 border border-yellow-500/30'
                  }`}>
                    {battleStatus}
                  </span>
                </div>
              </div>

              {/* Trigger Button */}
              <button
                onClick={triggerQuestionForAll}
                disabled={isTriggering}
                className={`w-full p-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center space-x-2 ${
                  isTriggering
                    ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl'
                }`}
              >
                {isTriggering ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Memulai...</span>
                  </>
                ) : (
                  <>
                    <Radio className="w-5 h-5" />
                    <span>🎯 TRIGGER PERTANYAAN</span>
                  </>
                )}
              </button>

              {/* Connected Count */}
              <div className="mt-4 text-center">
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-300">
                  <Users className="w-4 h-4" />
                  <span>{connectedCount} peserta terhubung</span>
                </div>
              </div>
            </div>
          </div>

          {/* Participant List */}
          <div className="lg:col-span-2">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <h2 className="text-xl font-bold text-white mb-6">Daftar Peserta</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Tim Merah */}
                <div>
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                    <h3 className="font-semibold text-white">Tim Merah</h3>
                    <span className="text-sm text-gray-300">({merahPlayers.length})</span>
                  </div>
                  
                  <div className="space-y-2">
                    {merahPlayers.map((player) => (
                      <div
                        key={player.pemainId}
                        className="flex items-center justify-between p-3 bg-red-500/10 rounded-lg border border-red-500/20"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm font-medium">
                              {player.nama.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="text-white font-medium">{player.nama}</p>
                            <p className="text-xs text-red-300">Tim Merah</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1">
                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                          <span className="text-xs text-green-300">Online</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tim Putih */}
                <div>
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="w-4 h-4 bg-white rounded-full"></div>
                    <h3 className="font-semibold text-white">Tim Putih</h3>
                    <span className="text-sm text-gray-300">({putihPlayers.length})</span>
                  </div>
                  
                  <div className="space-y-2">
                    {putihPlayers.map((player) => (
                      <div
                        key={player.pemainId}
                        className="flex items-center justify-between p-3 bg-white/10 rounded-lg border border-white/20"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                            <span className="text-gray-800 text-sm font-medium">
                              {player.nama.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="text-white font-medium">{player.nama}</p>
                            <p className="text-xs text-gray-300">Tim Putih</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1">
                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                          <span className="text-xs text-green-300">Online</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Total Stats */}
              <div className="mt-6 pt-6 border-t border-white/10">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-white">{connectedCount}</p>
                    <p className="text-sm text-gray-300">Total Peserta</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-red-400">{merahPlayers.length}</p>
                    <p className="text-sm text-gray-300">Tim Merah</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{putihPlayers.length}</p>
                    <p className="text-sm text-gray-300">Tim Putih</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 mt-6"
          >
            <p className="text-red-200 text-center">{error}</p>
          </motion.div>
        )}
      </div>

      {/* Socket Manager */}
      {user && (
        <SocketManager
          ref={handleSocketManagerRef}
          user={user}
          onReady={handleSocketReady}
          onBattleStart={handleBattleStart}
          onBattleEnd={handleBattleEnd}
        />
      )}
    </div>
  );
};

export default GameMasterPage; 