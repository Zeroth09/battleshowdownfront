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

// Get profil pemain
router.get('/profil', authMiddleware, async (req, res) => {
  try {
    const pemain = await Pemain.findById(req.pemain._id).select('-password');
    
    res.json({
      sukses: true,
      data: pemain
    });
  } catch (error) {
    console.error('Error get profil:', error);
    res.status(500).json({ 
      sukses: false, 
      pesan: 'Terjadi kesalahan server!' 
    });
  }
});

// Update lokasi pemain
router.post('/update-lokasi', authMiddleware, async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    
    if (!latitude || !longitude) {
      return res.status(400).json({ 
        sukses: false, 
        pesan: 'Latitude dan longitude harus diisi!' 
      });
    }
    
    await req.pemain.updateLokasi(latitude, longitude);
    
    res.json({
      sukses: true,
      pesan: 'Lokasi berhasil diupdate!',
      data: {
        latitude,
        longitude,
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('Error update lokasi:', error);
    res.status(500).json({ 
      sukses: false, 
      pesan: 'Terjadi kesalahan server!' 
    });
  }
});

// Get pemain online berdasarkan tim
router.get('/online/:tim', authMiddleware, async (req, res) => {
  try {
    const { tim } = req.params;
    
    if (!['merah', 'putih'].includes(tim)) {
      return res.status(400).json({ 
        sukses: false, 
        pesan: 'Tim harus merah atau putih!' 
      });
    }
    
    const pemainOnline = await Pemain.find({
      tim,
      status: 'online'
    }).select('nama tim lokasi terakhirAktif');
    
    res.json({
      sukses: true,
      data: pemainOnline
    });
  } catch (error) {
    console.error('Error get pemain online:', error);
    res.status(500).json({ 
      sukses: false, 
      pesan: 'Terjadi kesalahan server!' 
    });
  }
});

// Get statistik tim
router.get('/statistik-tim/:tim', authMiddleware, async (req, res) => {
  try {
    const { tim } = req.params;
    
    if (!['merah', 'putih'].includes(tim)) {
      return res.status(400).json({ 
        sukses: false, 
        pesan: 'Tim harus merah atau putih!' 
      });
    }
    
    const statistik = await Pemain.aggregate([
      { $match: { tim } },
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
    
    res.json({
      sukses: true,
      data: statistik[0] || {
        totalPemain: 0,
        totalBattle: 0,
        totalMenang: 0,
        totalKalah: 0,
        totalSkor: 0,
        pemainOnline: 0
      }
    });
  } catch (error) {
    console.error('Error get statistik tim:', error);
    res.status(500).json({ 
      sukses: false, 
      pesan: 'Terjadi kesalahan server!' 
    });
  }
});

// Update profil pemain
router.put('/profil', authMiddleware, async (req, res) => {
  try {
    const { nama } = req.body;
    
    if (!nama) {
      return res.status(400).json({ 
        sukses: false, 
        pesan: 'Nama harus diisi!' 
      });
    }
    
    req.pemain.nama = nama;
    await req.pemain.save();
    
    res.json({
      sukses: true,
      pesan: 'Profil berhasil diupdate!',
      data: {
        nama: req.pemain.nama,
        email: req.pemain.email,
        tim: req.pemain.tim
      }
    });
  } catch (error) {
    console.error('Error update profil:', error);
    res.status(500).json({ 
      sukses: false, 
      pesan: 'Terjadi kesalahan server!' 
    });
  }
});

// Get leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const leaderboard = await Pemain.find()
      .select('nama tim statistik')
      .sort({ 'statistik.skor': -1 })
      .limit(20);
    
    res.json({
      sukses: true,
      data: leaderboard
    });
  } catch (error) {
    console.error('Error get leaderboard:', error);
    res.status(500).json({ 
      sukses: false, 
      pesan: 'Terjadi kesalahan server!' 
    });
  }
});

module.exports = router; 