const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const googleSheetsService = require('./services/googleSheets');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Google Sheets
async function initializeDatabase() {
  const connected = await googleSheetsService.initialize();
  if (connected) {
    console.log('✅ Google Sheets connected successfully');
    
    // Clean up inactive players every 2 minutes
    setInterval(async () => {
      await googleSheetsService.clearInactivePlayers();
    }, 120000);
  } else {
    console.log('⚠️ Starting without Google Sheets connection...');
  }
}

initializeDatabase();

// Import routes
const authRoutes = require('./routes/auth');
const playerRoutes = require('./routes/pemain');
const battleRoutes = require('./routes/battle');
const pertanyaanRoutes = require('./routes/pertanyaan');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/pemain', playerRoutes);
app.use('/api/battle', battleRoutes);
app.use('/api/pertanyaan', pertanyaanRoutes);

// Root route untuk health check
app.get('/', (req, res) => {
  res.json({
    message: 'Battle Showdown Backend API',
    status: 'running',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  try {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      googleSheets: googleSheetsService.doc ? 'connected' : 'disconnected'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// Debug endpoint untuk melihat pemain aktif
app.get('/debug/pemain', async (req, res) => {
  try {
    const pemainList = Array.from(pemainAktif.entries()).map(([socketId, pemain]) => ({
      socketId,
      nama: pemain.nama,
      tim: pemain.tim,
      lokasi: pemain.lokasi
    }));
    
    // Juga ambil dari Google Sheets
    const sheetsPlayers = await googleSheetsService.getActivePlayers();
    
    res.json({
      totalPemainMemory: pemainAktif.size,
      totalPemainSheets: sheetsPlayers.length,
      pemainMemory: pemainList,
      pemainSheets: sheetsPlayers
    });
  } catch (error) {
    res.json({
      totalPemainMemory: pemainAktif.size,
      totalPemainSheets: 0,
      pemainMemory: Array.from(pemainAktif.entries()).map(([socketId, pemain]) => ({
        socketId,
        nama: pemain.nama,
        tim: pemain.tim,
        lokasi: pemain.lokasi
      })),
      pemainSheets: [],
      error: error.message
    });
  }
});

// Socket.IO untuk deteksi pemain real-time
const pemainAktif = new Map(); // socketId -> data pemain (in-memory cache)
const pertempuranAktif = new Map(); // battleId -> data pertempuran
const battleLocks = new Set(); // Mencegah multiple battle triggers
const locationUpdateTimers = new Map(); // Debounce untuk update location ke Google Sheets

// Periodic cleanup untuk battle yang lama
setInterval(() => {
  const now = Date.now();
  const battlesToRemove = [];
  
  pertempuranAktif.forEach((battle, battleId) => {
    // Hapus battle yang lebih dari 2 menit
    if (now - battle.waktuMulai > 120000) {
      console.log(`⏰ Cleaning up old battle: ${battleId}`);
      battlesToRemove.push(battleId);
    }
  });
  
  battlesToRemove.forEach(battleId => {
    pertempuranAktif.delete(battleId);
  });
  
  if (battlesToRemove.length > 0) {
    console.log(`🧹 Cleaned up ${battlesToRemove.length} old battles`);
    console.log(`📊 Total battles active: ${pertempuranAktif.size}`);
  }
}, 60000); // Check setiap 1 menit

io.on('connection', (socket) => {
  console.log('🟢 Pemain terhubung:', socket.id);
  console.log('📊 Total pemain aktif:', pemainAktif.size);
  
  // Debug: log all events
  socket.onAny((eventName, ...args) => {
    console.log(`📡 Socket ${socket.id} event: ${eventName}`, args);
  });
  
  // Debug: log connection state
  console.log(`🔗 Socket ${socket.id} connected. Total sockets: ${io.engine.clientsCount}`);
  
  // Debug: log connection details
  console.log(`🔗 Socket ${socket.id} connected with events:`, socket.eventNames());

  // Pemain bergabung dengan tim
  socket.on('bergabung-tim', async (data) => {
    const { pemainId, nama, tim, lokasi } = data;
    const playerData = {
      pemainId,
      nama,
      tim,
      lokasi: {
        latitude: lokasi.latitude,
        longitude: lokasi.longitude,
        timestamp: Date.now()
      }
    };
    
    // Simpan ke memory cache
    pemainAktif.set(socket.id, playerData);
    
    // Update ke Google Sheets dengan error handling
    try {
      await googleSheetsService.updatePlayerLocation(socket.id, playerData);
      console.log(`📊 Added ${nama} to Google Sheets`);
    } catch (error) {
      console.error('❌ Error adding player to Google Sheets:', error);
    }
    
    console.log(`📊 Total pemain aktif setelah bergabung: ${pemainAktif.size}`);
    console.log(`📊 Active players:`, Array.from(pemainAktif.values()).map(p => `${p.nama} (${p.tim})`));
    
    socket.join(tim); // Join room berdasarkan tim
    socket.emit('bergabung-berhasil', { tim, pemainId });
    
    // Broadcast ke pemain lain dalam tim yang sama
    socket.to(tim).emit('pemain-baru', { nama, tim });
  });

  // Update lokasi pemain
  socket.on('update-lokasi', async (lokasi) => {
    const pemain = pemainAktif.get(socket.id);
    if (pemain) {
      pemain.lokasi = {
        latitude: lokasi.latitude,
        longitude: lokasi.longitude,
        timestamp: Date.now()
      };
      
      console.log(`📍 Update lokasi ${pemain.nama} (${pemain.tim}): ${lokasi.latitude}, ${lokasi.longitude}`);
      
      // Debounce update ke Google Sheets (hanya update setiap 30 detik)
      if (locationUpdateTimers.has(socket.id)) {
        clearTimeout(locationUpdateTimers.get(socket.id));
      }
      
      locationUpdateTimers.set(socket.id, setTimeout(async () => {
        try {
          await googleSheetsService.updatePlayerLocation(socket.id, pemain);
          console.log(`📊 Updated ${pemain.nama} location to Google Sheets`);
        } catch (error) {
          console.error(`❌ Error updating ${pemain.nama} location to Google Sheets:`, error.message);
        }
      }, 30000)); // 30 detik debounce
      
      // Cek apakah ada pemain lawan dalam jarak 2 meter
      cekJarakPemain(socket.id, pemain);
    }
  });

  // Handle jawaban battle
  socket.on('jawab-battle', (data) => {
    console.log('📝 Received jawab-battle event:', data);
    console.log('📝 Socket ID:', socket.id);
    console.log('📝 All active battles:', Array.from(pertempuranAktif.keys()));
    console.log('📝 Total connected sockets:', io.engine.clientsCount);
    console.log('📝 All socket IDs:', Array.from(io.sockets.sockets.keys()));
    
    const { battleId, jawaban, pemainId } = data;
    const battle = pertempuranAktif.get(battleId);
    
    console.log('📝 Battle found:', battle ? 'yes' : 'no');
    console.log('📝 Battle selesai:', battle?.selesai);
    console.log('📝 Total battles active:', pertempuranAktif.size);
    console.log('📝 Active battle IDs:', Array.from(pertempuranAktif.keys()));
    
    if (!battle || battle.selesai) {
      console.log('❌ Battle not found or already finished');
      console.log('❌ Available battle IDs:', Array.from(pertempuranAktif.keys()));
      return;
    }

    console.log(`📝 ${pemainId} menjawab: ${jawaban} untuk battle ${battleId}`);
    console.log(`📝 Current answers in battle:`, battle.jawaban);

    // Cek apakah pemain sudah jawab sebelumnya
    const sudahJawab = battle.jawaban.find(j => j.pemainId === pemainId);
    if (sudahJawab) {
      console.log(`⚠️ Pemain ${pemainId} sudah jawab sebelumnya, skip`);
      return;
    }

    // Tambah jawaban ke battle
    battle.jawaban.push({
      pemainId,
      jawaban,
      waktu: Date.now()
    });

    console.log(`📝 Total answers now: ${battle.jawaban.length}`);
    console.log(`📝 Answers from players:`, battle.jawaban.map(j => `${j.pemainId}: ${j.jawaban}`));

    // Cek apakah ini jawaban pertama
    if (battle.jawaban.length === 1) {
      // Jawaban pertama - tunggu jawaban kedua
      console.log(`⏳ Menunggu jawaban kedua untuk battle ${battleId}`);
    } else if (battle.jawaban.length === 2) {
      // Kedua pemain sudah jawab - tentukan pemenang
      console.log(`🏁 Kedua pemain sudah jawab, menentukan pemenang...`);
      
      const jawaban1 = battle.jawaban[0];
      const jawaban2 = battle.jawaban[1];
      
      const pertanyaan = battle.pertanyaan;
      const jawabanBenar = pertanyaan.jawabanBenar;
      
      console.log(`📊 Jawaban 1: ${jawaban1.jawaban} (${jawaban1.pemainId})`);
      console.log(`📊 Jawaban 2: ${jawaban2.jawaban} (${jawaban2.pemainId})`);
      console.log(`📊 Jawaban benar: ${jawabanBenar}`);
      
      // Tentukan pemenang berdasarkan kecepatan dan kebenaran
      let pemenang = null;
      let pesan = '';
      
      if (jawaban1.jawaban === jawabanBenar && jawaban2.jawaban !== jawabanBenar) {
        // Pemain 1 benar, pemain 2 salah
        pemenang = jawaban1.pemainId;
        pesan = 'Jawaban cepat dan benar!';
      } else if (jawaban2.jawaban === jawabanBenar && jawaban1.jawaban !== jawabanBenar) {
        // Pemain 2 benar, pemain 1 salah
        pemenang = jawaban2.pemainId;
        pesan = 'Jawaban cepat dan benar!';
      } else if (jawaban1.jawaban === jawabanBenar && jawaban2.jawaban === jawabanBenar) {
        // Keduanya benar - yang lebih cepat menang
        if (jawaban1.waktu < jawaban2.waktu) {
          pemenang = jawaban1.pemainId;
          pesan = 'Jawaban cepat dan benar!';
        } else {
          pemenang = jawaban2.pemainId;
          pesan = 'Jawaban cepat dan benar!';
        }
      } else {
        // Keduanya salah - yang lebih cepat "menang" (tapi tetap kalah)
        if (jawaban1.waktu < jawaban2.waktu) {
          pemenang = jawaban1.pemainId;
          pesan = 'Jawaban cepat tapi salah!';
        } else {
          pemenang = jawaban2.pemainId;
          pesan = 'Jawaban cepat tapi salah!';
        }
      }

      console.log(`🏆 Pemenang: ${pemenang}, Pesan: ${pesan}`);

      // Tandai battle selesai
      battle.selesai = true;
      battle.pemenang = pemenang;
      battle.pesan = pesan;

      // Kirim hasil ke kedua pemain
      const hasilBattle = {
        pemenang,
        pesan,
        jawabanBenar,
        jawabanPemain: battle.jawaban
      };

      console.log('📤 Sending battle-selesai to players:', hasilBattle);
      io.to(battleId).emit('battle-selesai', hasilBattle);
      
      // Hapus battle dari memory
      pertempuranAktif.delete(battleId);
      
      // Cleanup battle locks
      const lockKeys = Array.from(battleLocks.keys());
      lockKeys.forEach(key => {
        if (key.includes(battleId.split('_')[1])) {
          battleLocks.delete(key);
        }
      });
      
      console.log(`🏆 Battle ${battleId} selesai. Pemenang: ${pemenang}`);
      console.log(`📊 Total battles active: ${pertempuranAktif.size}`);
    }
  });

  // Disconnect
  socket.on('disconnect', async () => {
    const pemain = pemainAktif.get(socket.id);
    if (pemain) {
      console.log(`🔴 Pemain terputus: ${socket.id} (${pemain.nama})`);
      socket.to(pemain.tim).emit('pemain-keluar', { nama: pemain.nama });
      pemainAktif.delete(socket.id);
      
      // Cleanup battles yang melibatkan pemain yang terputus
      const battlesToRemove = [];
      pertempuranAktif.forEach((battle, battleId) => {
        if (battle.pemain1.socketId === socket.id || battle.pemain2.socketId === socket.id) {
          console.log(`🗑️ Removing battle ${battleId} due to player disconnect`);
          battlesToRemove.push(battleId);
        }
      });
      
      battlesToRemove.forEach(battleId => {
        pertempuranAktif.delete(battleId);
      });
      
      // Remove dari Google Sheets
      try {
        await googleSheetsService.removePlayer(socket.id);
      } catch (error) {
        console.error('❌ Error removing player from Google Sheets:', error);
      }
      
      console.log(`📊 Total pemain aktif setelah disconnect: ${pemainAktif.size}`);
      console.log(`📊 Total battles aktif setelah disconnect: ${pertempuranAktif.size}`);
    } else {
      console.log(`🔴 Socket terputus tanpa data pemain: ${socket.id}`);
    }
  });
});

// Fungsi untuk cek jarak antar pemain
function cekJarakPemain(socketId, pemain) {
  const timLawan = pemain.tim === 'merah' ? 'putih' : 'merah';
  const pemainLawan = Array.from(pemainAktif.entries())
    .filter(([id, data]) => data.tim === timLawan && id !== socketId);

  console.log(`🔍 Cek jarak untuk ${pemain.nama} (${pemain.tim})`);
  console.log(`👥 Pemain lawan yang ditemukan: ${pemainLawan.length}`);

  pemainLawan.forEach(([idLawan, dataLawan]) => {
    const jarak = hitungJarak(
      pemain.lokasi.latitude, pemain.lokasi.longitude,
      dataLawan.lokasi.latitude, dataLawan.lokasi.longitude
    );

    console.log(`📏 Jarak ${pemain.nama} vs ${dataLawan.nama}: ${jarak.toFixed(2)} meter`);

    // Jika jarak <= 2 meter, trigger battle
    if (jarak <= 2) {
      // Buat lock key untuk mencegah multiple triggers
      const lockKey = [socketId, idLawan].sort().join('_');
      
      // Cek apakah sudah ada battle aktif atau lock
      const existingBattle = Array.from(pertempuranAktif.values()).find(battle => 
        battle.pemain1.socketId === socketId || battle.pemain2.socketId === socketId ||
        battle.pemain1.socketId === idLawan || battle.pemain2.socketId === idLawan
      );
      
      if (!existingBattle && !battleLocks.has(lockKey)) {
        console.log(`⚔️ BATTLE TRIGGERED! ${pemain.nama} vs ${dataLawan.nama} (${jarak.toFixed(2)}m)`);
        console.log(`📊 Total battles before trigger: ${pertempuranAktif.size}`);
        
        // Set lock untuk mencegah multiple triggers
        battleLocks.add(lockKey);
        
              // Clear lock setelah 5 detik
      setTimeout(() => {
        battleLocks.delete(lockKey);
      }, 5000);
      
        triggerBattle(socketId, idLawan, pemain, dataLawan);
      } else {
        console.log(`⏸️ Battle sudah aktif atau locked untuk ${pemain.nama}, skip trigger`);
        if (existingBattle) {
          console.log(`📊 Existing battle found for ${pemain.nama}`);
        }
      }
    }
  });
}

// Fungsi hitung jarak menggunakan formula Haversine
function hitungJarak(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Radius bumi dalam meter
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // Jarak dalam meter
}

// Fungsi trigger battle
async function triggerBattle(socketId1, socketId2, pemain1, pemain2) {
  try {
    // Ambil pertanyaan random dari Google Sheets
    const pertanyaan = await googleSheetsService.getRandomQuestion();
    
    console.log('📝 Pertanyaan dari Google Sheets:', pertanyaan);

    const battleId = `battle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    pertempuranAktif.set(battleId, {
      pemain1: { socketId: socketId1, ...pemain1 },
      pemain2: { socketId: socketId2, ...pemain2 },
      pertanyaan: pertanyaan,
      jawaban: [],
      selesai: false,
      waktuMulai: Date.now()
    });

    // Auto-clear battle setelah 30 detik jika tidak selesai
    setTimeout(() => {
      const battle = pertempuranAktif.get(battleId);
      if (battle && !battle.selesai) {
        console.log(`⏰ Battle ${battleId} timeout, clearing...`);
        pertempuranAktif.delete(battleId);
      }
    }, 30000);

    // Validate pertanyaan data
    if (!pertanyaan.pilihanJawaban || Object.keys(pertanyaan.pilihanJawaban).length === 0) {
      console.error('❌ Pertanyaan tidak valid:', pertanyaan);
      console.log('🔄 Using fallback question...');
      let fallbackPertanyaan = {
        id: 'fallback_1',
        pertanyaan: 'Ibu kota Indonesia adalah?',
        pilihanJawaban: {
          a: 'Jakarta',
          b: 'Bandung', 
          c: 'Surabaya',
          d: 'Yogyakarta'
        },
        jawabanBenar: 'a',
        kategori: 'umum',
        tingkatKesulitan: 'mudah'
      };
      pertanyaan = fallbackPertanyaan;
    }

    const battleData = {
      id: battleId,
      pertanyaan: pertanyaan.pertanyaan,
      pilihanJawaban: pertanyaan.pilihanJawaban,
      jawabanBenar: pertanyaan.jawabanBenar,
      kategori: pertanyaan.kategori,
      tingkatKesulitan: pertanyaan.tingkatKesulitan,
      lawan: {
        nama: pemain2.nama,
        tim: pemain2.tim
      }
    };

    console.log('📤 Sending battle data to players:', battleData);

    // Kirim battle ke kedua pemain dengan format yang benar
    io.to(socketId1).emit('battle-dimulai', battleData);
    io.to(socketId2).emit('battle-dimulai', battleData);

    // Join kedua pemain ke room battle
    io.sockets.sockets.get(socketId1)?.join(battleId);
    io.sockets.sockets.get(socketId2)?.join(battleId);

    console.log(`⚔️ Battle ${battleId} dimulai: ${pemain1.nama} vs ${pemain2.nama}`);

  } catch (error) {
    console.error('Error trigger battle:', error);
  }
}



const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Server berjalan di port ${PORT}`);
  console.log('🚀 Sistem deteksi pemain siap!');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('📋 SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed successfully');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('📋 SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed successfully');
    process.exit(0);
  });
});

// Export untuk testing
module.exports = {
  app,
  hitungJarak,
  triggerBattle,
  cekJarakPemain
}; 