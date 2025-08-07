const express = require('express');
const router = express.Router();
const Pertanyaan = require('../models/pertanyaan');

// Get semua pertanyaan (untuk admin)
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, kategori, tingkatKesulitan } = req.query;
    
    let query = { aktif: true };
    if (kategori) query.kategori = kategori;
    if (tingkatKesulitan) query.tingkatKesulitan = tingkatKesulitan;
    
    const pertanyaan = await Pertanyaan.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));
    
    const total = await Pertanyaan.countDocuments(query);
    
    res.json({
      sukses: true,
      data: pertanyaan,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error get pertanyaan:', error);
    res.status(500).json({ 
      sukses: false, 
      pesan: 'Terjadi kesalahan server!' 
    });
  }
});

// Get pertanyaan berdasarkan kategori
router.get('/kategori/:kategori', async (req, res) => {
  try {
    const { kategori } = req.params;
    const { limit = 10 } = req.query;
    
    const pertanyaan = await Pertanyaan.getPertanyaanByKategori(kategori, parseInt(limit));
    
    res.json({
      sukses: true,
      data: pertanyaan
    });
  } catch (error) {
    console.error('Error get pertanyaan by kategori:', error);
    res.status(500).json({ 
      sukses: false, 
      pesan: 'Terjadi kesalahan server!' 
    });
  }
});

// Get pertanyaan random (untuk battle)
router.get('/random', async (req, res) => {
  try {
    const pertanyaan = await Pertanyaan.getPertanyaanRandom();
    
    if (pertanyaan.length === 0) {
      return res.status(404).json({ 
        sukses: false, 
        pesan: 'Tidak ada pertanyaan tersedia!' 
      });
    }
    
    res.json({
      sukses: true,
      data: pertanyaan[0]
    });
  } catch (error) {
    console.error('Error get pertanyaan random:', error);
    res.status(500).json({ 
      sukses: false, 
      pesan: 'Terjadi kesalahan server!' 
    });
  }
});

// Tambah pertanyaan baru (untuk admin)
router.post('/', async (req, res) => {
  try {
    const { 
      pertanyaan, 
      pilihanJawaban, 
      jawabanBenar, 
      kategori, 
      tingkatKesulitan,
      penjelasan 
    } = req.body;
    
    // Validasi input
    if (!pertanyaan || !pilihanJawaban || !jawabanBenar) {
      return res.status(400).json({ 
        sukses: false, 
        pesan: 'Pertanyaan, pilihan jawaban, dan jawaban benar harus diisi!' 
      });
    }
    
    if (!pilihanJawaban.a || !pilihanJawaban.b || !pilihanJawaban.c || !pilihanJawaban.d) {
      return res.status(400).json({ 
        sukses: false, 
        pesan: 'Semua pilihan jawaban harus diisi!' 
      });
    }
    
    if (!['a', 'b', 'c', 'd'].includes(jawabanBenar)) {
      return res.status(400).json({ 
        sukses: false, 
        pesan: 'Jawaban benar harus a, b, c, atau d!' 
      });
    }
    
    const pertanyaanBaru = new Pertanyaan({
      pertanyaan,
      pilihanJawaban,
      jawabanBenar,
      kategori: kategori || 'umum',
      tingkatKesulitan: tingkatKesulitan || 'sedang',
      penjelasan
    });
    
    await pertanyaanBaru.save();
    
    res.status(201).json({
      sukses: true,
      pesan: 'Pertanyaan berhasil ditambahkan!',
      data: pertanyaanBaru
    });
  } catch (error) {
    console.error('Error tambah pertanyaan:', error);
    res.status(500).json({ 
      sukses: false, 
      pesan: 'Terjadi kesalahan server!' 
    });
  }
});

// Update pertanyaan (untuk admin)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const pertanyaan = await Pertanyaan.findById(id);
    if (!pertanyaan) {
      return res.status(404).json({ 
        sukses: false, 
        pesan: 'Pertanyaan tidak ditemukan!' 
      });
    }
    
    // Update field yang diizinkan
    const allowedFields = ['pertanyaan', 'pilihanJawaban', 'jawabanBenar', 'kategori', 'tingkatKesulitan', 'penjelasan', 'aktif'];
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        pertanyaan[field] = updateData[field];
      }
    });
    
    await pertanyaan.save();
    
    res.json({
      sukses: true,
      pesan: 'Pertanyaan berhasil diupdate!',
      data: pertanyaan
    });
  } catch (error) {
    console.error('Error update pertanyaan:', error);
    res.status(500).json({ 
      sukses: false, 
      pesan: 'Terjadi kesalahan server!' 
    });
  }
});

// Hapus pertanyaan (untuk admin)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const pertanyaan = await Pertanyaan.findById(id);
    if (!pertanyaan) {
      return res.status(404).json({ 
        sukses: false, 
        pesan: 'Pertanyaan tidak ditemukan!' 
      });
    }
    
    // Soft delete dengan mengubah status aktif
    pertanyaan.aktif = false;
    await pertanyaan.save();
    
    res.json({
      sukses: true,
      pesan: 'Pertanyaan berhasil dihapus!'
    });
  } catch (error) {
    console.error('Error hapus pertanyaan:', error);
    res.status(500).json({ 
      sukses: false, 
      pesan: 'Terjadi kesalahan server!' 
    });
  }
});

// Get statistik pertanyaan (untuk admin)
router.get('/statistik', async (req, res) => {
  try {
    const statistik = await Pertanyaan.aggregate([
      {
        $group: {
          _id: null,
          totalPertanyaan: { $sum: 1 },
          pertanyaanAktif: {
            $sum: {
              $cond: [{ $eq: ['$aktif', true] }, 1, 0]
            }
          },
          rataRataDigunakan: { $avg: '$digunakan' },
          rataRataKeberhasilan: { $avg: '$tingkatKeberhasilan' }
        }
      }
    ]);
    
    const statistikKategori = await Pertanyaan.aggregate([
      { $match: { aktif: true } },
      {
        $group: {
          _id: '$kategori',
          jumlah: { $sum: 1 },
          rataRataDigunakan: { $avg: '$digunakan' },
          rataRataKeberhasilan: { $avg: '$tingkatKeberhasilan' }
        }
      }
    ]);
    
    res.json({
      sukses: true,
      data: {
        global: statistik[0] || {
          totalPertanyaan: 0,
          pertanyaanAktif: 0,
          rataRataDigunakan: 0,
          rataRataKeberhasilan: 0
        },
        kategori: statistikKategori
      }
    });
  } catch (error) {
    console.error('Error get statistik pertanyaan:', error);
    res.status(500).json({ 
      sukses: false, 
      pesan: 'Terjadi kesalahan server!' 
    });
  }
});

module.exports = router; 