const express = require('express');
const router = express.Router();
const Pemain = require('../models/pemain');
const jwt = require('jsonwebtoken');

// Middleware untuk autentikasi
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        sukses: false, 
        pesan: 'Token tidak ditemukan!' 
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'rahasia-jwt');
    const pemain = await Pemain.findById(decoded.pemainId);
    
    if (!pemain) {
      return res.status(404).json({ 
        sukses: false, 
        pesan: 'Pemain tidak ditemukan!' 
      });
    }
    
    req.pemain = pemain;
    next();
  } catch (error) {
    return res.status(401).json({ 
      sukses: false, 
      pesan: 'Token tidak valid!' 
    });
  }
};

// Get riwayat battle pemain
router.get('/riwayat', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    // Untuk sementara, kita akan menggunakan data dari statistik pemain
    // Nanti bisa ditambahkan model BattleHistory untuk menyimpan detail battle
    const pemain = await Pemain.findById(req.pemain._id);
    
    res.json({
      sukses: true,
      data: {
        totalBattle: pemain.statistik.totalBattle,
        menang: pemain.statistik.menang,
        kalah: pemain.statistik.kalah,
        skor: pemain.statistik.skor,
        winRate: pemain.statistik.totalBattle > 0 
          ? ((pemain.statistik.menang / pemain.statistik.totalBattle) * 100).toFixed(1)
          : 0
      }
    });
  } catch (error) {
    console.error('Error get riwayat battle:', error);
    res.status(500).json({ 
      sukses: false, 
      pesan: 'Terjadi kesalahan server!' 
    });
  }
});

// Update statistik battle (dipanggil setelah battle selesai)
router.post('/update-statistik', authMiddleware, async (req, res) => {
  try {
    const { hasil } = req.body;
    
    if (!['menang', 'kalah'].includes(hasil)) {
      return res.status(400).json({ 
        sukses: false, 
        pesan: 'Hasil harus menang atau kalah!' 
      });
    }
    
    await req.pemain.updateStatistik(hasil);
    
    res.json({
      sukses: true,
      pesan: 'Statistik berhasil diupdate!',
      data: req.pemain.statistik
    });
  } catch (error) {
    console.error('Error update statistik battle:', error);
    res.status(500).json({ 
      sukses: false, 
      pesan: 'Terjadi kesalahan server!' 
    });
  }
});

// Get statistik battle global
router.get('/statistik-global', async (req, res) => {
  try {
    const statistik = await Pemain.aggregate([
      {
        $group: {
          _id: null,
          totalPemain: { $sum: 1 },
          totalBattle: { $sum: '$statistik.totalBattle' },
          totalMenang: { $sum: '$statistik.menang' },
          totalKalah: { $sum: '$statistik.kalah' },
          totalSkor: { $sum: '$statistik.skor' },
          pemainOnline: {
            $sum: {
              $cond: [{ $eq: ['$status', 'online'] }, 1, 0]
            }
          }
        }
      }
    ]);
    
    const statistikTim = await Pemain.aggregate([
      {
        $group: {
          _id: '$tim',
          totalPemain: { $sum: 1 },
          totalBattle: { $sum: '$statistik.totalBattle' },
          totalMenang: { $sum: '$statistik.menang' },
          totalKalah: { $sum: '$statistik.kalah' },
          totalSkor: { $sum: '$statistik.skor' },
          pemainOnline: {
            $sum: {
              $cond: [{ $eq: ['$status', 'online'] }, 1, 0]
            }
          }
        }
      }
    ]);
    
    res.json({
      sukses: true,
      data: {
        global: statistik[0] || {
          totalPemain: 0,
          totalBattle: 0,
          totalMenang: 0,
          totalKalah: 0,
          totalSkor: 0,
          pemainOnline: 0
        },
        tim: statistikTim
      }
    });
  } catch (error) {
    console.error('Error get statistik global:', error);
    res.status(500).json({ 
      sukses: false, 
      pesan: 'Terjadi kesalahan server!' 
    });
  }
});

// Get top pemain berdasarkan skor
router.get('/top-pemain', async (req, res) => {
  try {
    const { limit = 10, tim } = req.query;
    
    let query = {};
    if (tim && ['merah', 'putih'].includes(tim)) {
      query.tim = tim;
    }
    
    const topPemain = await Pemain.find(query)
      .select('nama tim statistik')
      .sort({ 'statistik.skor': -1, 'statistik.menang': -1 })
      .limit(parseInt(limit));
    
    res.json({
      sukses: true,
      data: topPemain
    });
  } catch (error) {
    console.error('Error get top pemain:', error);
    res.status(500).json({ 
      sukses: false, 
      pesan: 'Terjadi kesalahan server!' 
    });
  }
});

// Get battle yang sedang berlangsung (untuk admin/monitoring)
router.get('/sedang-berlangsung', authMiddleware, async (req, res) => {
  try {
    // Ini akan diimplementasikan nanti untuk monitoring battle yang sedang berlangsung
    // Untuk sementara return empty array
    res.json({
      sukses: true,
      data: []
    });
  } catch (error) {
    console.error('Error get battle sedang berlangsung:', error);
    res.status(500).json({ 
      sukses: false, 
      pesan: 'Terjadi kesalahan server!' 
    });
  }
});

module.exports = router; 