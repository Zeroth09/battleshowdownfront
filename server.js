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

io.on('connection', (socket) => {
  console.log('🟢 Pemain terhubung:', socket.id);
  console.log('📊 Total pemain aktif:', pemainAktif.size);

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
    
    // Simpan ke memory cache dan Google Sheets
    pemainAktif.set(socket.id, playerData);
    await googleSheetsService.updatePlayerLocation(socket.id, playerData);
    
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
      
      // Update ke Google Sheets
      await googleSheetsService.updatePlayerLocation(socket.id, pemain);
      
      // Cek apakah ada pemain lawan dalam jarak 2 meter
      cekJarakPemain(socket.id, pemain);
    }
  });

  // Handle jawaban battle
  socket.on('jawab-battle', (data) => {
    const { battleId, jawaban, pemainId } = data;
    const battle = pertempuranAktif.get(battleId);
    
    if (!battle || battle.selesai) {
      return;
    }

    console.log(`📝 ${pemainId} menjawab: ${jawaban} untuk battle ${battleId}`);

    // Tambah jawaban ke battle
    battle.jawaban.push({
      pemainId,
      jawaban,
      waktu: Date.now()
    });

    // Cek apakah ini jawaban pertama
    if (battle.jawaban.length === 1) {
      // Jawaban pertama - tunggu jawaban kedua
      console.log(`⏳ Menunggu jawaban kedua untuk battle ${battleId}`);
    } else if (battle.jawaban.length === 2) {
      // Kedua pemain sudah jawab - tentukan pemenang
      const jawaban1 = battle.jawaban[0];
      const jawaban2 = battle.jawaban[1];
      
      const pertanyaan = battle.pertanyaan;
      const jawabanBenar = pertanyaan.jawabanBenar;
      
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

      io.to(battleId).emit('battle-selesai', hasilBattle);
      
      // Hapus battle dari memory
      pertempuranAktif.delete(battleId);
      
      console.log(`🏆 Battle ${battleId} selesai. Pemenang: ${pemenang}`);
    }
  });

  // Disconnect
  socket.on('disconnect', async () => {
    const pemain = pemainAktif.get(socket.id);
    if (pemain) {
      socket.to(pemain.tim).emit('pemain-keluar', { nama: pemain.nama });
      pemainAktif.delete(socket.id);
      
      // Remove dari Google Sheets
      await googleSheetsService.removePlayer(socket.id);
    }
    console.log('Pemain terputus:', socket.id);
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
      // Cek apakah sudah ada battle aktif untuk pemain ini
      const existingBattle = Array.from(pertempuranAktif.values()).find(battle => 
        battle.pemain1.socketId === socketId || battle.pemain2.socketId === socketId ||
        battle.pemain1.socketId === idLawan || battle.pemain2.socketId === idLawan
      );
      
      if (!existingBattle) {
        console.log(`⚔️ BATTLE TRIGGERED! ${pemain.nama} vs ${dataLawan.nama} (${jarak.toFixed(2)}m)`);
        triggerBattle(socketId, idLawan, pemain, dataLawan);
      } else {
        console.log(`⏸️ Battle sudah aktif untuk ${pemain.nama}, skip trigger`);
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

    // Kirim battle ke kedua pemain dengan format yang benar
    io.to(socketId1).emit('battle-dimulai', {
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
    });

    io.to(socketId2).emit('battle-dimulai', {
      id: battleId,
      pertanyaan: pertanyaan.pertanyaan,
      pilihanJawaban: pertanyaan.pilihanJawaban,
      jawabanBenar: pertanyaan.jawabanBenar,
      kategori: pertanyaan.kategori,
      tingkatKesulitan: pertanyaan.tingkatKesulitan,
      lawan: {
        nama: pemain1.nama,
        tim: pemain1.tim
      }
    });

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