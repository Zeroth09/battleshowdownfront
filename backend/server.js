const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const path = require('path');

// Import routes
const pertanyaanSheetsRoutes = require('./routes/pertanyaan-sheets');

// Load environment variables from env.local
dotenv.config({ path: path.join(__dirname, 'env.local') });

// Log environment variables for debugging
console.log('🔧 Environment variables loaded:');
console.log('GOOGLE_SHEET_ID:', process.env.GOOGLE_SHEET_ID ? '✅ Set' : '❌ Not set');
console.log('GOOGLE_SERVICE_ACCOUNT_EMAIL:', process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ? '✅ Set' : '❌ Not set');
console.log('GOOGLE_PRIVATE_KEY:', process.env.GOOGLE_PRIVATE_KEY ? '✅ Set' : '❌ Not set');

const app = express();
const server = http.createServer(app);

// Improved CORS configuration for Socket.IO
const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:3000", "http://127.0.0.1:3000", "https://battleshowdownfront.vercel.app"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    transports: ['websocket', 'polling']
  },
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000
});

// Google Sheets setup
let doc, questionsSheet, playersSheet;

async function initializeGoogleSheets() {
  // Skip Google Sheets if environment variables not set
  if (!process.env.GOOGLE_SHEET_ID || !process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
    console.log('⚠️ Google Sheets environment variables not set, skipping initialization');
    return;
  }

  try {
    doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID);
    await doc.useServiceAccountAuth({
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n')
    });
    await doc.loadInfo();
    
    questionsSheet = doc.sheetsByTitle['Questions'];
    playersSheet = doc.sheetsByTitle['Players'];
    
    console.log('✅ Google Sheets initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing Google Sheets:', error);
  }
}

// Initialize Google Sheets
initializeGoogleSheets();

// Middleware
app.use(cors({
  origin: ["http://localhost:3000", "http://127.0.0.1:3000", "https://battleshowdownfront.vercel.app"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));
app.use(express.json());

// In-memory storage
const pemainAktif = new Map();
const pertempuranAktif = new Map();
const lobbyPlayers = new Map();
const spectators = new Map();
const battleLocks = new Set();

// Helper functions
function hitungJarak(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

async function ambilPertanyaanRandom() {
  try {
    if (!questionsSheet) {
      console.log('⚠️ Questions sheet not available, returning sample question');
      // Return sample question for development
      return {
        pertanyaan: "Ibu kota Indonesia adalah?",
        pilihanJawaban: {
          a: "Jakarta",
          b: "Bandung", 
          c: "Surabaya",
          d: "Yogyakarta"
        },
        jawabanBenar: "a"
      };
    }

    const rows = await questionsSheet.getRows();
    if (rows.length === 0) {
      console.error('❌ No questions found in sheet');
      return null;
    }

    // Skip header row and get random question
    const randomIndex = Math.floor(Math.random() * (rows.length - 1)) + 1;
    const question = rows[randomIndex];
    
    return {
      pertanyaan: question.get('pertanyaan'),
      pilihanJawaban: {
        a: question.get('a'),
        b: question.get('b'),
        c: question.get('c'),
        d: question.get('d')
      },
      jawabanBenar: question.get('jawaban_benar')
    };
  } catch (error) {
    console.error('❌ Error getting random question:', error);
    return null;
  }
}

async function tambahPemainKeSheet(pemain) {
  try {
    if (!playersSheet) {
      console.log('⚠️ Players sheet not available, skipping Google Sheets update');
      return;
    }

    await playersSheet.addRow({
      pemain_id: pemain.pemainId,
      nama: pemain.nama,
      tim: pemain.tim,
      latitude: pemain.lokasi?.latitude || '',
      longitude: pemain.lokasi?.longitude || '',
      waktu_bergabung: new Date().toISOString()
    });
    
    console.log('✅ Player added to Google Sheets:', pemain.nama);
  } catch (error) {
    console.error('❌ Error adding player to sheet:', error);
  }
}

// Debounce function for location updates
const locationUpdateQueue = new Map();
function debounceLocationUpdate(pemainId, location) {
  if (locationUpdateQueue.has(pemainId)) {
    clearTimeout(locationUpdateQueue.get(pemainId));
  }
  
  locationUpdateQueue.set(pemainId, setTimeout(async () => {
    try {
      if (playersSheet) {
        const rows = await playersSheet.getRows();
        const playerRow = rows.find(row => row.get('pemain_id') === pemainId);
        if (playerRow) {
          playerRow.set('latitude', location.latitude);
          playerRow.set('longitude', location.longitude);
          playerRow.set('waktu_update', new Date().toISOString());
          await playerRow.save();
        }
      } else {
        console.log('⚠️ Players sheet not available, skipping location update');
      }
    } catch (error) {
      console.error('❌ Error updating player location:', error);
    }
  }, 30000)); // 30 second debounce
}

// Routes
app.use('/api/pertanyaan/sheets', pertanyaanSheetsRoutes);

// Route untuk pertanyaan random
app.get('/api/pertanyaan/random', async (req, res) => {
  try {
    const pertanyaan = await ambilPertanyaanRandom();
    if (!pertanyaan) {
      return res.status(404).json({
        sukses: false,
        pesan: 'Tidak ada pertanyaan tersedia'
      });
    }
    
    res.json({
      sukses: true,
      data: pertanyaan
    });
  } catch (error) {
    console.error('Error getting random pertanyaan:', error);
    res.status(500).json({
      sukses: false,
      pesan: 'Terjadi kesalahan server'
    });
  }
});

app.get('/', (req, res) => {
  res.json({ 
    message: 'Battle Showdown Backend API',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    activePlayers: pemainAktif.size,
    activeBattles: pertempuranAktif.size,
    lobbyPlayers: lobbyPlayers.size,
    spectators: spectators.size
  });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`🔌 New connection: ${socket.id}`);

  // Join lobby
  socket.on('join-lobby', async (data) => {
    const { pemainId, nama, tim, lokasi } = data;
    
    console.log(`👤 Player joining lobby: ${nama} (${tim})`);
    
    // Store player data
    pemainAktif.set(socket.id, {
      pemainId,
      nama,
      tim,
      lokasi,
      socketId: socket.id
    });
    
    lobbyPlayers.set(pemainId, {
      pemainId,
      nama,
      tim,
      lokasi,
      socketId: socket.id
    });

    // Add to Google Sheets
    await tambahPemainKeSheet({ pemainId, nama, tim, lokasi });

    // Broadcast to all clients
    io.emit('lobby-update', {
      players: Array.from(lobbyPlayers.values()),
      count: lobbyPlayers.size
    });

    console.log(`✅ ${nama} joined lobby. Total: ${lobbyPlayers.size}`);
  });

  // Join spectator
  socket.on('join-spectator', (data) => {
    const { spectatorId, nama } = data;
    
    console.log(`👁️ Spectator joining: ${nama}`);
    
    spectators.set(spectatorId, {
      spectatorId,
      nama,
      socketId: socket.id
    });

    // Broadcast to all clients
    io.emit('spectator-update', {
      spectators: Array.from(spectators.values()),
      count: spectators.size
    });

    console.log(`✅ ${nama} joined as spectator. Total: ${spectators.size}`);
  });

  // Leave lobby
  socket.on('leave-lobby', (data) => {
    const { pemainId } = data;
    
    console.log(`👤 Player leaving lobby: ${pemainId}`);
    
    lobbyPlayers.delete(pemainId);
    pemainAktif.delete(socket.id);

    // Broadcast to all clients
    io.emit('lobby-update', {
      players: Array.from(lobbyPlayers.values()),
      count: lobbyPlayers.size
    });

    console.log(`✅ Player left lobby. Total: ${lobbyPlayers.size}`);
  });

  // Update location
  socket.on('update-lokasi', (data) => {
    const { latitude, longitude } = data;
    const player = pemainAktif.get(socket.id);
    
    if (player) {
      player.lokasi = { latitude, longitude };
      pemainAktif.set(socket.id, player);
      
      // Update in lobby
      const lobbyPlayer = lobbyPlayers.get(player.pemainId);
      if (lobbyPlayer) {
        lobbyPlayer.lokasi = { latitude, longitude };
        lobbyPlayers.set(player.pemainId, lobbyPlayer);
      }

      // Debounced update to Google Sheets
      debounceLocationUpdate(player.pemainId, { latitude, longitude });
    }
  });

  // Game Master Events
  socket.on('game-master-trigger-battle', async (data) => {
    const { battleData, gameMasterId } = data;
    console.log(`👑 Game Master ${gameMasterId} triggered global battle`);

    // Get random question from database
    const question = await ambilPertanyaanRandom();
    if (!question) {
      console.error('❌ No question available');
      return;
    }

    const battleId = `battle_${Date.now()}`;
    const battle = {
      id: battleId,
      pertanyaan: question.pertanyaan,
      pilihanJawaban: question.pilihanJawaban,
      jawabanBenar: question.jawabanBenar,
      lawan: {
        nama: 'Semua Peserta',
        tim: 'global'
      },
      waktuMulai: Date.now(),
      gameMasterId
    };

    // Store battle
    pertempuranAktif.set(battleId, battle);

    // Broadcast battle to all connected players
    io.emit('global-battle-start', {
      battleData: battle,
      gameMasterId,
      timestamp: Date.now()
    });

    console.log(`📡 Global battle broadcasted to ${io.engine.clientsCount} players`);
  });

  socket.on('game-master-end-battle', (data) => {
    const { result, gameMasterId } = data;
    console.log(`👑 Game Master ${gameMasterId} ended global battle`);

    // Broadcast battle end to all connected players
    io.emit('global-battle-end', {
      result,
      gameMasterId,
      timestamp: Date.now()
    });

    console.log(`📡 Global battle end broadcasted to ${io.engine.clientsCount} players`);
  });

  // Answer battle
  socket.on('jawab-battle', async (data) => {
    const { battleId, jawaban, pemainId, nama, tim } = data;
    
    console.log(`📝 Answer received from ${nama} (${pemainId}) for battle ${battleId}: ${jawaban}`);
    console.log(`📊 Active battles: ${pertempuranAktif.size}`);
    console.log(`📊 Total connected sockets: ${io.engine.clientsCount}`);
    console.log(`📊 All socket IDs:`, Array.from(io.sockets.sockets.keys()));

    // Check if player already answered this battle
    const lockKey = `${battleId}_${pemainId}`;
    if (battleLocks.has(lockKey)) {
      console.log(`⚠️ Player ${nama} already answered battle ${battleId}`);
      return;
    }

    // Add lock to prevent duplicate answers
    battleLocks.add(lockKey);

    const battle = pertempuranAktif.get(battleId);
    if (!battle) {
      console.log(`❌ Battle ${battleId} not found or already finished`);
      socket.emit('battle-error', {
        message: 'Battle tidak ditemukan atau sudah selesai',
        battleId
      });
      return;
    }

    // Check if answer is correct
    const isCorrect = jawaban === battle.jawabanBenar;
    
    // Create result
    const result = {
      pemenang: {
        pemainId,
        nama,
        tim
      },
      jawabanBenar: battle.jawabanBenar,
      jawabanPeserta: jawaban,
      isCorrect,
      battleId,
      timestamp: Date.now()
    };

    // Broadcast live answer to spectators
    const liveAnswer = {
      pemainId,
      nama,
      tim,
      jawaban,
      waktu: new Date()
    };
    io.emit('live-answer', liveAnswer);

    console.log(`🏆 Battle result: ${nama} answered ${jawaban} (correct: ${isCorrect})`);

    // Send result to the player
    socket.emit('battle-selesai', result);

    // Remove battle from active battles
    pertempuranAktif.delete(battleId);

    // Clean up locks
    battleLocks.delete(lockKey);

    console.log(`✅ Battle ${battleId} completed. Active battles: ${pertempuranAktif.size}`);
  });

  // Disconnect handling
  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
    
    const player = pemainAktif.get(socket.id);
    if (player) {
      console.log(`👤 Player disconnected: ${player.nama}`);
      
      // Remove from active players
      pemainAktif.delete(socket.id);
      lobbyPlayers.delete(player.pemainId);

      // Check if player was in any active battles
      for (const [battleId, battle] of pertempuranAktif.entries()) {
        if (battle.gameMasterId === player.pemainId) {
          console.log(`❌ Game Master disconnected, removing battle ${battleId}`);
          pertempuranAktif.delete(battleId);
          
          // Notify other players
          io.emit('battle-dibatalkan', {
            message: 'Game Master terputus',
            battleId
          });
        }
      }

      // Broadcast lobby update
      io.emit('lobby-update', {
        players: Array.from(lobbyPlayers.values()),
        count: lobbyPlayers.size
      });
    }

    // Remove spectator
    for (const [spectatorId, spectator] of spectators.entries()) {
      if (spectator.socketId === socket.id) {
        console.log(`👁️ Spectator disconnected: ${spectator.nama}`);
        spectators.delete(spectatorId);
        
        io.emit('spectator-update', {
          spectators: Array.from(spectators.values()),
          count: spectators.size
        });
        break;
      }
    }
  });
});

// Periodic cleanup of old battles
setInterval(() => {
  const now = Date.now();
  let cleanedCount = 0;
  
  for (const [battleId, battle] of pertempuranAktif.entries()) {
    if (now - battle.waktuMulai > 120000) { // 2 minutes
      pertempuranAktif.delete(battleId);
      cleanedCount++;
    }
  }
  
  if (cleanedCount > 0) {
    console.log(`🧹 Cleaned up ${cleanedCount} old battles`);
  }
}, 60000); // Check every minute

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
}); 