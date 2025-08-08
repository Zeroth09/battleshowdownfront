'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, Users, Clock, Trophy, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
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

interface LiveAnswer {
  pemainId: string;
  nama: string;
  tim: 'merah' | 'putih';
  jawaban: string;
  waktu: Date;
}

interface LiveResult {
  pemenang: {
    pemainId: string;
    nama: string;
    tim: string;
  };
  jawabanBenar: string;
  jawabanPeserta: string;
  isCorrect: boolean;
}

const SpectatorPage: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Battle | null>(null);
  const [liveAnswers, setLiveAnswers] = useState<LiveAnswer[]>([]);
  const [liveResults, setLiveResults] = useState<LiveResult[]>([]);
  const [participantStatus, setParticipantStatus] = useState<User[]>([]);
  const [isQuestionActive, setIsQuestionActive] = useState<boolean>(false);
  const [questionTimer, setQuestionTimer] = useState<number>(0);
  const [connectedCount, setConnectedCount] = useState<number>(0);
  
  const socketManagerRef = useRef<any>(null);
  const [socketManagerReady, setSocketManagerReady] = useState<boolean>(false);

  // Create spectator user
  useEffect(() => {
    const spectatorUser: User = {
      pemainId: `spectator_${Date.now()}`,
      nama: 'Spectator',
      tim: 'merah' // Default team for spectator
    };
    
    setUser(spectatorUser);
    localStorage.setItem('spectator', JSON.stringify(spectatorUser));
  }, []);

  // Mock participant data for demo
  useEffect(() => {
    const mockParticipants: User[] = [
      { pemainId: 'p1', nama: 'Ahmad', tim: 'merah' },
      { pemainId: 'p2', nama: 'Budi', tim: 'putih' },
      { pemainId: 'p3', nama: 'Citra', tim: 'merah' },
      { pemainId: 'p4', nama: 'Dewi', tim: 'putih' },
      { pemainId: 'p5', nama: 'Eko', tim: 'merah' }
    ];
    setParticipantStatus(mockParticipants);
    setConnectedCount(mockParticipants.length);
  }, []);

  const handleBattleStart = (battleData: Battle) => {
    console.log('👁️ Spectator: Battle started:', battleData);
    setCurrentQuestion(battleData);
    setIsQuestionActive(true);
    setLiveAnswers([]);
    setLiveResults([]);
    setQuestionTimer(0);
    
    // Start timer
    const timer = setInterval(() => {
      setQuestionTimer(prev => prev + 1);
    }, 1000);
    
    // Auto clear after 30 seconds
    setTimeout(() => {
      clearInterval(timer);
      setIsQuestionActive(false);
    }, 30000);
  };

  const handleBattleEnd = (result: any) => {
    console.log('👁️ Spectator: Battle ended:', result);
    setIsQuestionActive(false);
    
    if (result) {
      const newResult: LiveResult = {
        pemenang: result.pemenang,
        jawabanBenar: result.jawabanBenar,
        jawabanPeserta: result.jawabanPeserta,
        isCorrect: result.jawabanBenar === result.jawabanPeserta
      };
      setLiveResults(prev => [...prev, newResult]);
    }
  };

  const handleLiveAnswer = (answerData: LiveAnswer) => {
    console.log('👁️ Spectator: Live answer received:', answerData);
    setLiveAnswers(prev => [...prev, answerData]);
  };

  const handleSocketReady = () => {
    setSocketManagerReady(true);
  };

  const handleSocketManagerRef = (ref: any) => {
    socketManagerRef.current = ref;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getAnswerLabel = (answer: string) => {
    const labels: { [key: string]: string } = {
      'a': 'A',
      'b': 'B', 
      'c': 'C',
      'd': 'D'
    };
    return labels[answer] || answer;
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Memuat Spectator...</p>
        </div>
      </div>
    );
  }

  const merahPlayers = participantStatus.filter(p => p.tim === 'merah');
  const putihPlayers = participantStatus.filter(p => p.tim === 'putih');

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                <Eye className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Spectator Live View</h1>
                <p className="text-sm text-gray-300">Lihat pertanyaan dan jawaban real-time</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link 
                href="/game-master"
                className="flex items-center space-x-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Game Master</span>
              </Link>
              
              <div className="flex items-center space-x-2 text-sm text-gray-300">
                <Users className="w-4 h-4" />
                <span>{connectedCount} peserta</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Current Question */}
          <div className="lg:col-span-2">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Pertanyaan Saat Ini</h2>
                {isQuestionActive && (
                  <div className="flex items-center space-x-2 text-yellow-400">
                    <Clock className="w-5 h-5" />
                    <span className="font-mono text-lg">{formatTime(questionTimer)}</span>
                  </div>
                )}
              </div>

              {currentQuestion ? (
                <div className="space-y-6">
                  {/* Question */}
                  <div className="bg-black/20 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">
                      {currentQuestion.pertanyaan}
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries(currentQuestion.pilihanJawaban).map(([key, value]) => (
                        <div
                          key={key}
                          className="p-3 bg-white/10 rounded-lg border border-white/20"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                              <span className="text-white font-medium">{key.toUpperCase()}</span>
                            </div>
                            <span className="text-white">{value}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Live Answers */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Jawaban Real-time</h3>
                    <div className="space-y-3">
                      {liveAnswers.map((answer, index) => (
                        <motion.div
                          key={`${answer.pemainId}-${index}`}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className={`flex items-center justify-between p-3 rounded-lg border ${
                            answer.tim === 'merah' 
                              ? 'bg-red-500/10 border-red-500/20' 
                              : 'bg-white/10 border-white/20'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              answer.tim === 'merah' ? 'bg-red-500' : 'bg-white'
                            }`}>
                              <span className={`font-medium ${
                                answer.tim === 'merah' ? 'text-white' : 'text-gray-800'
                              }`}>
                                {answer.nama.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <p className="text-white font-medium">{answer.nama}</p>
                              <p className={`text-xs ${
                                answer.tim === 'merah' ? 'text-red-300' : 'text-gray-300'
                              }`}>
                                Tim {answer.tim.charAt(0).toUpperCase() + answer.tim.slice(1)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-lg font-bold text-blue-400">
                              {getAnswerLabel(answer.jawaban)}
                            </span>
                            <span className="text-xs text-gray-400">
                              {answer.waktu.toLocaleTimeString()}
                            </span>
                          </div>
                        </motion.div>
                      ))}
                      
                      {liveAnswers.length === 0 && (
                        <div className="text-center py-8 text-gray-400">
                          <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                          <p>Menunggu jawaban dari peserta...</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Live Results */}
                  {liveResults.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-4">Hasil Real-time</h3>
                      <div className="space-y-3">
                        {liveResults.map((result, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`p-4 rounded-lg border ${
                              result.isCorrect 
                                ? 'bg-green-500/10 border-green-500/20' 
                                : 'bg-red-500/10 border-red-500/20'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                {result.isCorrect ? (
                                  <Trophy className="w-6 h-6 text-green-400" />
                                ) : (
                                  <XCircle className="w-6 h-6 text-red-400" />
                                )}
                                <div>
                                  <p className="text-white font-medium">{result.pemenang.nama}</p>
                                  <p className="text-sm text-gray-300">
                                    Tim {result.pemenang.tim.charAt(0).toUpperCase() + result.pemenang.tim.slice(1)}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-white font-medium">
                                  Jawaban: {getAnswerLabel(result.jawabanPeserta)}
                                </p>
                                <p className={`text-sm ${
                                  result.isCorrect ? 'text-green-400' : 'text-red-400'
                                }`}>
                                  {result.isCorrect ? 'BENAR' : 'SALAH'}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Eye className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">Belum Ada Pertanyaan</h3>
                  <p className="text-gray-400">Game Master belum memulai pertanyaan</p>
                </div>
              )}
            </div>
          </div>

          {/* Participant Status */}
          <div className="lg:col-span-1">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <h2 className="text-xl font-bold text-white mb-6">Status Peserta</h2>
              
              <div className="space-y-4">
                {/* Tim Merah */}
                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <h3 className="font-semibold text-white">Tim Merah</h3>
                    <span className="text-sm text-gray-300">({merahPlayers.length})</span>
                  </div>
                  
                  <div className="space-y-2">
                    {merahPlayers.map((player) => (
                      <div
                        key={player.pemainId}
                        className="flex items-center justify-between p-2 bg-red-500/10 rounded-lg"
                      >
                        <span className="text-white text-sm">{player.nama}</span>
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tim Putih */}
                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="w-3 h-3 bg-white rounded-full"></div>
                    <h3 className="font-semibold text-white">Tim Putih</h3>
                    <span className="text-sm text-gray-300">({putihPlayers.length})</span>
                  </div>
                  
                  <div className="space-y-2">
                    {putihPlayers.map((player) => (
                      <div
                        key={player.pemainId}
                        className="flex items-center justify-between p-2 bg-white/10 rounded-lg"
                      >
                        <span className="text-white text-sm">{player.nama}</span>
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Statistics */}
              <div className="mt-6 pt-6 border-t border-white/10">
                <div className="grid grid-cols-2 gap-4 text-center">
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

export default SpectatorPage; 