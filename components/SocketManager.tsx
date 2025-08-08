'use client';

import React, { useEffect, useRef, useImperativeHandle } from 'react';
import { io, Socket } from 'socket.io-client';

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

interface BattleResult {
  menang: boolean;
  pesan: string;
}

interface SocketManagerProps {
  user: User;
  initialLocation?: {
    latitude: number;
    longitude: number;
  };
  onBattleStart: (data: Battle) => void;
  onBattleEnd: (result: BattleResult) => void;
  onNearbyPlayers: (players: any[]) => void;
}

const SocketManager = React.forwardRef<{ submitAnswer: (battleId: string, answer: string) => void }, SocketManagerProps>(({
  user,
  initialLocation,
  onBattleStart,
  onBattleEnd,
  onNearbyPlayers
}, ref) => {
  const socketRef = useRef<Socket | null>(null);
  const locationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Connect ke Socket.IO server
    const socket = io('https://battleshowdownback-production-df38.up.railway.app', {
      transports: ['websocket', 'polling']
    });

    socketRef.current = socket;

    // Event listeners
    socket.on('connect', () => {
      console.log('🟢 Connected to server:', socket.id);
      
      // Bergabung dengan tim
      if (initialLocation) {
        socket.emit('bergabung-tim', {
          pemainId: user.pemainId,
          nama: user.nama,
          tim: user.tim,
          lokasi: initialLocation
        });
      } else if (navigator.geolocation) {
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
      console.log('✅ Berhasil bergabung dengan tim:', data);
    });

    socket.on('pemain-baru', (data) => {
      console.log('👤 Pemain baru bergabung:', data);
    });

    socket.on('battle-dimulai', (data) => {
      console.log('⚔️ Battle dimulai:', data);
      onBattleStart(data);
    });

    socket.on('battle-selesai', (data) => {
      console.log('🏁 Battle selesai:', data);
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
      console.log('📍 Starting location tracking...');
      // Update lokasi setiap 5 detik
      locationIntervalRef.current = setInterval(() => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            console.log(`📍 Location update: ${latitude}, ${longitude}`);
            if (socketRef.current) {
              socketRef.current.emit('update-lokasi', { latitude, longitude });
            }
          },
          (error) => {
            console.error('❌ Error updating location:', error);
          }
        );
      }, 5000);
    }
  };

  const submitAnswer = (battleId: string, answer: string) => {
    if (socketRef.current) {
      console.log(`📝 Submitting answer: ${answer} for battle: ${battleId}`);
      socketRef.current.emit('jawab-battle', {
        battleId,
        jawaban: answer,
        pemainId: user.pemainId
      });
    }
  };

  // Expose submitAnswer function untuk digunakan di parent component
  useImperativeHandle(ref, () => ({
    submitAnswer
  }));

  return null; // Component ini tidak render apapun
});

export default SocketManager; 