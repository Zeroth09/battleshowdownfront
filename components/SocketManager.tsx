'use client';

import React, { forwardRef, useImperativeHandle, useEffect, useState } from 'react';
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

interface LiveAnswer {
  pemainId: string;
  nama: string;
  tim: 'merah' | 'putih';
  jawaban: string;
  waktu: Date;
}

interface SocketManagerProps {
  user: User;
  onReady?: () => void;
  onBattleStart?: (battleData: Battle) => void;
  onBattleEnd?: (result: any) => void;
  onLiveAnswer?: (answerData: LiveAnswer) => void;
}

export interface SocketManagerRef {
  socket: Socket | null;
  submitAnswer: (battleId: string, answer: string) => Promise<void>;
  joinLobby: () => void;
  leaveLobby: () => void;
  joinSpectator: () => void;
}

const SocketManager = forwardRef<SocketManagerRef, SocketManagerProps>(
  ({ user, onReady, onBattleStart, onBattleEnd, onLiveAnswer }, ref) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    // Initialize socket connection
    useEffect(() => {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://battleshowdownback-production-df38.up.railway.app';
      
      const newSocket = io(backendUrl, {
        transports: ['websocket', 'polling'],
        timeout: 20000,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      setSocket(newSocket);

      // Connection events
      newSocket.on('connect', () => {
        console.log('🔌 Connected to server');
        setIsConnected(true);
        
        // Send user data to server
        newSocket.emit('join-lobby', {
          pemainId: user.pemainId,
          nama: user.nama,
          tim: user.tim,
          lokasi: user.lokasi
        });
      });

      newSocket.on('disconnect', () => {
        console.log('🔌 Disconnected from server');
        setIsConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('❌ Connection error:', error);
        setIsConnected(false);
      });

      // Battle events
      newSocket.on('battle-start', (battleData: Battle) => {
        console.log('⚔️ Battle started:', battleData);
        onBattleStart?.(battleData);
      });

      newSocket.on('battle-selesai', (result: any) => {
        console.log('🏁 Battle finished:', result);
        onBattleEnd?.(result);
      });

      // Battle cancellation events
      newSocket.on('battle-dibatalkan', (data: any) => {
        console.log('❌ Battle cancelled:', data);
        window.dispatchEvent(new CustomEvent('battle-dibatalkan', { detail: data }));
      });

      newSocket.on('battle-error', (data: any) => {
        console.log('❌ Battle error:', data);
        window.dispatchEvent(new CustomEvent('battle-error', { detail: data }));
      });

      // Global battle events (Game Master)
      newSocket.on('global-battle-start', (data: any) => {
        console.log('👑 Global battle started:', data);
        onBattleStart?.(data.battleData);
      });

      newSocket.on('global-battle-end', (data: any) => {
        console.log('👑 Global battle ended:', data);
        onBattleEnd?.(data.result);
      });

      // Live answer events (Spectator)
      newSocket.on('live-answer', (answerData: LiveAnswer) => {
        console.log('👁️ Live answer received:', answerData);
        onLiveAnswer?.(answerData);
      });

      // Lobby events
      newSocket.on('lobby-update', (data: any) => {
        console.log('👥 Lobby updated:', data);
      });

      // Spectator events
      newSocket.on('spectator-update', (data: any) => {
        console.log('👁️ Spectator update:', data);
      });

      // Call onReady after connection is established
      setTimeout(() => {
        if (onReady) {
          onReady();
        }
      }, 2000);

      return () => {
        newSocket.close();
      };
    }, [user, onReady, onBattleStart, onBattleEnd, onLiveAnswer]);

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      socket,
      submitAnswer: async (battleId: string, answer: string) => {
        if (!socket) {
          throw new Error('Socket not connected');
        }
        
        return new Promise<void>((resolve, reject) => {
          socket.emit('jawab-battle', {
            battleId,
            jawaban: answer,
            pemainId: user.pemainId,
            nama: user.nama,
            tim: user.tim
          }, (response: any) => {
            if (response.success) {
              console.log('✅ Answer submitted successfully');
              resolve();
            } else {
              console.error('❌ Failed to submit answer:', response.error);
              reject(new Error(response.error));
            }
          });
        });
      },
      joinLobby: () => {
        if (socket) {
          socket.emit('join-lobby', {
            pemainId: user.pemainId,
            nama: user.nama,
            tim: user.tim,
            lokasi: user.lokasi
          });
        }
      },
      leaveLobby: () => {
        if (socket) {
          socket.emit('leave-lobby', {
            pemainId: user.pemainId
          });
        }
      },
      joinSpectator: () => {
        if (socket) {
          socket.emit('join-spectator', {
            spectatorId: user.pemainId,
            nama: user.nama
          });
        }
      }
    }), [socket, user]);

    // Expose socket globally for fallback
    useEffect(() => {
      if (socket) {
        (window as any).socket = {
          submitAnswer: async (battleId: string, answer: string) => {
            if (!socket) throw new Error('Socket not connected');
            
            return new Promise<void>((resolve, reject) => {
              socket.emit('jawab-battle', {
                battleId,
                jawaban: answer,
                pemainId: user.pemainId,
                nama: user.nama,
                tim: user.tim
              }, (response: any) => {
                if (response.success) {
                  resolve();
                } else {
                  reject(new Error(response.error));
                }
              });
            });
          }
        };
      }
    }, [socket, user]);

    return null; // This component doesn't render anything
  }
);

SocketManager.displayName = 'SocketManager';

export default SocketManager; 