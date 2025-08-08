'use client';

import React from 'react';
import Link from 'next/link';
import { Users, Crown, Eye, ArrowRight } from 'lucide-react';

const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-2">Lomba Battle Showdown</h1>
            <p className="text-gray-300">Sistem pertempuran real-time dengan spectator live view</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Peserta */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all duration-300">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Peserta</h2>
              <p className="text-gray-300">Bergabung dalam pertempuran</p>
            </div>
            
            <div className="space-y-4 mb-6">
              <div className="flex items-center space-x-3 text-sm text-gray-300">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>Join waiting room</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-gray-300">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>Jawab pertanyaan</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-gray-300">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>Lihat hasil otomatis</span>
              </div>
            </div>
            
            <Link 
              href="/lomba"
              className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold py-3 px-6 rounded-xl flex items-center justify-center space-x-2 transition-all duration-200"
            >
              <span>Mulai Sebagai Peserta</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>

          {/* Game Master */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all duration-300">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Crown className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Game Master</h2>
              <p className="text-gray-300">Kontrol pertempuran</p>
            </div>
            
            <div className="space-y-4 mb-6">
              <div className="flex items-center space-x-3 text-sm text-gray-300">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>Lihat daftar peserta</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-gray-300">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>Trigger pertanyaan</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-gray-300">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>Monitor real-time</span>
              </div>
            </div>
            
            <Link 
              href="/game-master"
              className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold py-3 px-6 rounded-xl flex items-center justify-center space-x-2 transition-all duration-200"
            >
              <span>Mulai Sebagai Game Master</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>

          {/* Spectator */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all duration-300">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Eye className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Spectator</h2>
              <p className="text-gray-300">Lihat live view</p>
            </div>
            
            <div className="space-y-4 mb-6">
              <div className="flex items-center space-x-3 text-sm text-gray-300">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>Lihat pertanyaan</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-gray-300">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>Jawaban real-time</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-gray-300">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>Hasil live</span>
              </div>
            </div>
            
            <Link 
              href="/spectator"
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-3 px-6 rounded-xl flex items-center justify-center space-x-2 transition-all duration-200"
            >
              <span>Mulai Sebagai Spectator</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-12 bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
          <h3 className="text-xl font-bold text-white mb-4 text-center">Cara Menggunakan</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h4 className="font-semibold text-white mb-3">Untuk Event Organizer:</h4>
              <ol className="space-y-2 text-sm text-gray-300">
                <li>1. Buka halaman <strong className="text-white">Game Master</strong></li>
                <li>2. Tunggu peserta bergabung di lobby</li>
                <li>3. Klik "TRIGGER PERTANYAAN" untuk memulai</li>
                <li>4. Monitor jawaban real-time</li>
              </ol>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-3">Untuk Peserta:</h4>
              <ol className="space-y-2 text-sm text-gray-300">
                <li>1. Buka halaman <strong className="text-white">Peserta</strong></li>
                <li>2. Tunggu pertanyaan dari Game Master</li>
                <li>3. Jawab dengan cepat dan benar</li>
                <li>4. Lihat hasil otomatis</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage; 