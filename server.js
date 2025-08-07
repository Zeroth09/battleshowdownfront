const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
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

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/battle-games', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('✅ Database connected successfully');
}).catch((error) => {
  console.error('❌ Database connection error:', error);
  console.log('⚠️ Starting without database connection...');
});

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
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Debug endpoint untuk melihat pemain aktif
app.get('/debug/pemain', (req, res) => {
  const pemainList = Array.from(pemainAktif.entries()).map(([socketId, pemain]) => ({
    socketId,
    nama: pemain.nama,
    tim: pemain.tim,
    lokasi: pemain.lokasi
  }));
  
  res.json({
    totalPemain: pemainAktif.size,
    pemain: pemainList
  });
});

// Socket.IO untuk deteksi pemain real-time
const pemainAktif = new Map(); // socketId -> data pemain
const pertempuranAktif = new Map(); // battleId -> data pertempuran

io.on('connection', (socket) => {
  console.log('🟢 Pemain terhubung:', socket.id);
  console.log('📊 Total pemain aktif:', pemainAktif.size);

  // Pemain bergabung dengan tim
  socket.on('bergabung-tim', (data) => {
    const { pemainId, nama, tim, lokasi } = data;
    pemainAktif.set(socket.id, {
      pemainId,
      nama,
      tim,
      lokasi: {
        latitude: lokasi.latitude,
        longitude: lokasi.longitude,
        timestamp: Date.now()
      }
    });
    
    socket.join(tim); // Join room berdasarkan tim
    socket.emit('bergabung-berhasil', { tim, pemainId });
    
    // Broadcast ke pemain lain dalam tim yang sama
    socket.to(tim).emit('pemain-baru', { nama, tim });
  });

  // Update lokasi pemain
  socket.on('update-lokasi', (lokasi) => {
    const pemain = pemainAktif.get(socket.id);
    if (pemain) {
      pemain.lokasi = {
        latitude: lokasi.latitude,
        longitude: lokasi.longitude,
        timestamp: Date.now()
      };
      
      console.log(`📍 Update lokasi ${pemain.nama} (${pemain.tim}): ${lokasi.latitude}, ${lokasi.longitude}`);
      
      // Cek apakah ada pemain lawan dalam jarak 2 meter
      cekJarakPemain(socket.id, pemain);
    }
  });

  // Jawaban pertanyaan battle
  socket.on('jawab-pertanyaan', (data) => {
    const { battleId, jawaban, waktuJawab } = data;
    const pertempuran = pertempuranAktif.get(battleId);
    
    if (pertempuran && !pertempuran.selesai) {
      const pemain = pemainAktif.get(socket.id);
      if (pemain) {
        // Cek jawaban
        const benar = pertempuran.pertanyaan.jawabanBenar === jawaban;
        const waktuTercepat = pertempuran.jawaban.length === 0;
        
        pertempuran.jawaban.push({
          pemainId: pemain.pemainId,
          nama: pemain.nama,
          tim: pemain.tim,
          jawaban,
          benar,
          waktuJawab
        });

        // Jika ada yang jawab duluan
        if (pertempuran.jawaban.length === 1) {
          const hasil = benar ? 'menang' : 'kalah';
          io.to(battleId).emit('battle-selesai', {
            pemenang: pemain.nama,
            timPemenang: pemain.tim,
            hasil,
            instruksi: benar ? 'Lanjutkan perjalanan!' : 'Kembali ke awal!'
          });
          
          pertempuran.selesai = true;
          pertempuranAktif.delete(battleId);
        }
      }
    }
  });

  // Disconnect
  socket.on('disconnect', () => {
    const pemain = pemainAktif.get(socket.id);
    if (pemain) {
      socket.to(pemain.tim).emit('pemain-keluar', { nama: pemain.nama });
      pemainAktif.delete(socket.id);
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
      console.log(`⚔️ BATTLE TRIGGERED! ${pemain.nama} vs ${dataLawan.nama} (${jarak.toFixed(2)}m)`);
      triggerBattle(socketId, idLawan, pemain, dataLawan);
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
    // Ambil pertanyaan random dari database
    const Pertanyaan = require('./models/pertanyaan');
    let pertanyaan;
    
    try {
      pertanyaan = await Pertanyaan.aggregate([{ $sample: { size: 1 } }]);
    } catch (error) {
      console.log('⚠️ Database not available, using fallback question');
      // Fallback pertanyaan jika database tidak tersedia
      pertanyaan = [{
        pertanyaan: 'Ibu kota Indonesia adalah?',
        pilihanJawaban: {
          a: 'Jakarta',
          b: 'Bandung',
          c: 'Surabaya',
          d: 'Yogyakarta'
        },
        jawabanBenar: 'a'
      }];
    }
    
    if (pertanyaan.length === 0) return;

    const battleId = `battle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    pertempuranAktif.set(battleId, {
      pemain1: { socketId: socketId1, ...pemain1 },
      pemain2: { socketId: socketId2, ...pemain2 },
      pertanyaan: pertanyaan[0],
      jawaban: [],
      selesai: false,
      waktuMulai: Date.now()
    });

    // Kirim battle ke kedua pemain
    io.to(socketId1).emit('battle-dimulai', {
      battleId,
      lawan: pemain2.nama,
      timLawan: pemain2.tim,
      pertanyaan: pertanyaan[0]
    });

    io.to(socketId2).emit('battle-dimulai', {
      battleId,
      lawan: pemain1.nama,
      timLawan: pemain1.tim,
      pertanyaan: pertanyaan[0]
    });

    // Join kedua pemain ke room battle
    io.sockets.sockets.get(socketId1)?.join(battleId);
    io.sockets.sockets.get(socketId2)?.join(battleId);

  } catch (error) {
    console.error('Error trigger battle:', error);
  }
}

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server berjalan di port ${PORT}`);
  console.log('🚀 Sistem deteksi pemain siap!');
});

// Export untuk testing
module.exports = {
  app,
  hitungJarak,
  triggerBattle,
  cekJarakPemain
}; 