'use client';

import React, { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

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

interface SocketManagerProps {
  user: User;
  onBattleStart: (data: BattleData) => void;
  onBattleEnd: (result: BattleResult) => void;
  onNearbyPlayers: (players: any[]) => void;
}

const SocketManager: React.FC<SocketManagerProps> = ({
  user,
  onBattleStart,
  onBattleEnd,
  onNearbyPlayers
}) => {
  const socketRef = useRef<Socket | null>(null);
  const locationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Connect ke Socket.IO server
    const socket = io(process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000', {
      transports: ['websocket', 'polling']
    });

    socketRef.current = socket;

    // Event listeners
    socket.on('connect', () => {
      console.log('Connected to server');
      
      // Bergabung dengan tim
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            socket.emit('bergabung-tim', {
              pemainId: user.pemainId,
              nama: user.nama,
              tim: user.tim,
              lokasi: { latitude, longitude }
            });
          },
          (error) => {
            console.error('Error getting location:', error);
            // Default location (Jakarta)
            socket.emit('bergabung-tim', {
              pemainId: user.pemainId,
              nama: user.nama,
              tim: user.tim,
              lokasi: { latitude: -6.2088, longitude: 106.8456 }
            });
          }
        );
      }
    });

    socket.on('bergabung-berhasil', (data) => {
      console.log('Berhasil bergabung dengan tim:', data);
    });

    socket.on('pemain-baru', (data) => {
      console.log('Pemain baru bergabung:', data);
    });

    socket.on('battle-dimulai', (data) => {
      console.log('Battle dimulai:', data);
      onBattleStart(data);
    });

    socket.on('battle-selesai', (data) => {
      console.log('Battle selesai:', data);
      onBattleEnd(data);
    });

    socket.on('pemain-keluar', (data) => {
      console.log('Pemain keluar:', data);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    // Start location tracking
    startLocationTracking();

    return () => {
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current);
      }
      socket.disconnect();
    };
  }, [user]);

  const startLocationTracking = () => {
    if (navigator.geolocation) {
      // Update lokasi setiap 5 detik
      locationIntervalRef.current = setInterval(() => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            if (socketRef.current) {
              socketRef.current.emit('update-lokasi', { latitude, longitude });
            }
          },
          (error) => {
            console.error('Error updating location:', error);
          }
        );
      }, 5000);
    }
  };

  const submitAnswer = (battleId: string, answer: string) => {
    if (socketRef.current) {
      socketRef.current.emit('jawab-pertanyaan', {
        battleId,
        jawaban: answer,
        waktuJawab: Date.now()
      });
    }
  };

  // Expose submitAnswer function untuk digunakan di parent component
  const submitAnswerRef = React.useRef(submitAnswer);
  submitAnswerRef.current = submitAnswer;

  return null; // Component ini tidak render apapun
};

export default SocketManager; 