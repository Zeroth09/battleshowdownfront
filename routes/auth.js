const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();
const Pemain = require('../models/pemain');

// Middleware untuk validasi input
const validasiRegister = (req, res, next) => {
  const { nama, email, password, tim } = req.body;
  
  if (!nama || !email || !password || !tim) {
    return res.status(400).json({ 
      sukses: false, 
      pesan: 'Semua field harus diisi!' 
    });
  }
  
  if (password.length < 6) {
    return res.status(400).json({ 
      sukses: false, 
      pesan: 'Password minimal 6 karakter!' 
    });
  }
  
  if (!['merah', 'putih'].includes(tim)) {
    return res.status(400).json({ 
      sukses: false, 
      pesan: 'Tim harus merah atau putih!' 
    });
  }
  
  next();
};

// Register pemain baru
router.post('/register', validasiRegister, async (req, res) => {
  try {
    const { nama, email, password, tim } = req.body;
    
    // Cek apakah email sudah terdaftar
    const pemainExist = await Pemain.findOne({ email });
    if (pemainExist) {
      return res.status(400).json({ 
        sukses: false, 
        pesan: 'Email sudah terdaftar!' 
      });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Buat pemain baru
    const pemain = new Pemain({
      nama,
      email,
      password: hashedPassword,
      tim
    });
    
    await pemain.save();
    
    // Generate JWT token
    const token = jwt.sign(
      { pemainId: pemain._id, tim: pemain.tim },
      process.env.JWT_SECRET || 'rahasia-jwt',
      { expiresIn: '7d' }
    );
    
    res.status(201).json({
      sukses: true,
      pesan: 'Registrasi berhasil!',
      data: {
        pemainId: pemain._id,
        nama: pemain.nama,
        email: pemain.email,
        tim: pemain.tim,
        token
      }
    });
    
  } catch (error) {
    console.error('Error register:', error);
    res.status(500).json({ 
      sukses: false, 
      pesan: 'Terjadi kesalahan server!' 
    });
  }
});

// Login pemain
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        sukses: false, 
        pesan: 'Email dan password harus diisi!' 
      });
    }
    
    // Cari pemain berdasarkan email
    const pemain = await Pemain.findOne({ email });
    if (!pemain) {
      return res.status(400).json({ 
        sukses: false, 
        pesan: 'Email atau password salah!' 
      });
    }
    
    // Cek password
    const isPasswordValid = await bcrypt.compare(password, pemain.password);
    if (!isPasswordValid) {
      return res.status(400).json({ 
        sukses: false, 
        pesan: 'Email atau password salah!' 
      });
    }
    
    // Update status online
    pemain.status = 'online';
    pemain.terakhirAktif = new Date();
    await pemain.save();
    
    // Generate JWT token
    const token = jwt.sign(
      { pemainId: pemain._id, tim: pemain.tim },
      process.env.JWT_SECRET || 'rahasia-jwt',
      { expiresIn: '7d' }
    );
    
    res.json({
      sukses: true,
      pesan: 'Login berhasil!',
      data: {
        pemainId: pemain._id,
        nama: pemain.nama,
        email: pemain.email,
        tim: pemain.tim,
        statistik: pemain.statistik,
        token
      }
    });
    
  } catch (error) {
    console.error('Error login:', error);
    res.status(500).json({ 
      sukses: false, 
      pesan: 'Terjadi kesalahan server!' 
    });
  }
});

// Logout pemain
router.post('/logout', async (req, res) => {
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
    
    if (pemain) {
      pemain.status = 'offline';
      await pemain.save();
    }
    
    res.json({
      sukses: true,
      pesan: 'Logout berhasil!'
    });
    
  } catch (error) {
    console.error('Error logout:', error);
    res.status(500).json({ 
      sukses: false, 
      pesan: 'Terjadi kesalahan server!' 
    });
  }
});

// Verifikasi token
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        sukses: false, 
        pesan: 'Token tidak ditemukan!' 
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'rahasia-jwt');
    const pemain = await Pemain.findById(decoded.pemainId).select('-password');
    
    if (!pemain) {
      return res.status(404).json({ 
        sukses: false, 
        pesan: 'Pemain tidak ditemukan!' 
      });
    }
    
    res.json({
      sukses: true,
      data: pemain
    });
    
  } catch (error) {
    console.error('Error verify token:', error);
    res.status(401).json({ 
      sukses: false, 
      pesan: 'Token tidak valid!' 
    });
  }
});

module.exports = router; 