const express = require('express');
const router = express.Router();
const googleSheetsService = require('../services/googleSheets');

// Get semua pertanyaan dari Google Sheets
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, kategori, tingkatKesulitan } = req.query;
    
    // Initialize Google Sheets
    const connected = await googleSheetsService.initialize();
    if (!connected) {
      return res.status(500).json({ 
        sukses: false, 
        pesan: 'Gagal terhubung ke Google Sheets!' 
      });
    }

    // Get semua pertanyaan dari sheets
    const rows = await googleSheetsService.questionsSheet.getRows();
    
    // Filter berdasarkan kategori dan tingkat kesulitan
    let filteredRows = rows;
    if (kategori && kategori !== 'semua') {
      filteredRows = filteredRows.filter(row => row.kategori === kategori);
    }
    if (tingkatKesulitan && tingkatKesulitan !== 'semua') {
      filteredRows = filteredRows.filter(row => row.tingkat_kesulitan === tingkatKesulitan);
    }
    
    // Pagination
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    const paginatedRows = filteredRows.slice(startIndex, endIndex);
    
    // Transform data ke format yang diharapkan frontend
    const pertanyaan = paginatedRows.map(row => ({
      _id: row.id || `sheet_${row._rowNumber}`,
      pertanyaan: row.pertanyaan,
      pilihanJawaban: {
        a: row.pilihan_a,
        b: row.pilihan_b,
        c: row.pilihan_c,
        d: row.pilihan_d
      },
      jawabanBenar: row.jawaban_benar,
      kategori: row.kategori || 'umum',
      tingkatKesulitan: row.tingkat_kesulitan || 'sedang',
      digunakan: parseInt(row.digunakan) || 0,
      tingkatKeberhasilan: parseFloat(row.tingkat_keberhasilan) || 0
    }));
    
    res.json({
      sukses: true,
      data: pertanyaan,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: filteredRows.length,
        pages: Math.ceil(filteredRows.length / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error get pertanyaan from sheets:', error);
    res.status(500).json({ 
      sukses: false, 
      pesan: 'Terjadi kesalahan server!' 
    });
  }
});

// POST - Tambah pertanyaan baru ke Google Sheets
router.post('/', async (req, res) => {
  try {
    const { pertanyaan, pilihanJawaban, jawabanBenar, kategori, tingkatKesulitan } = req.body;
    
    // Validasi input
    if (!pertanyaan || !pilihanJawaban || !jawabanBenar || !kategori || !tingkatKesulitan) {
      return res.status(400).json({
        sukses: false,
        pesan: 'Semua field harus diisi!'
      });
    }
    
    // Initialize Google Sheets
    const connected = await googleSheetsService.initialize();
    if (!connected) {
      return res.status(500).json({ 
        sukses: false, 
        pesan: 'Gagal terhubung ke Google Sheets!' 
      });
    }

    // Tambah pertanyaan ke Google Sheets
    const success = await googleSheetsService.addQuestion({
      pertanyaan,
      pilihanJawaban,
      jawabanBenar,
      kategori,
      tingkatKesulitan
    });
    
    if (!success) {
      return res.status(500).json({
        sukses: false,
        pesan: 'Gagal menambahkan pertanyaan ke Google Sheets!'
      });
    }
    
    res.json({
      sukses: true,
      pesan: 'Pertanyaan berhasil ditambahkan ke Google Sheets!',
      data: {
        pertanyaan,
        pilihanJawaban,
        jawabanBenar,
        kategori,
        tingkatKesulitan
      }
    });
    
  } catch (error) {
    console.error('Error adding pertanyaan to sheets:', error);
    res.status(500).json({ 
      sukses: false, 
      pesan: 'Terjadi kesalahan server!' 
    });
  }
});

// Get pertanyaan berdasarkan kategori dari Google Sheets
router.get('/kategori/:kategori', async (req, res) => {
  try {
    const { kategori } = req.params;
    const { limit = 10 } = req.query;
    
    // Initialize Google Sheets
    const connected = await googleSheetsService.initialize();
    if (!connected) {
      return res.status(500).json({ 
        sukses: false, 
        pesan: 'Gagal terhubung ke Google Sheets!' 
      });
    }

    // Get pertanyaan berdasarkan kategori
    const rows = await googleSheetsService.questionsSheet.getRows();
    const filteredRows = rows.filter(row => row.kategori === kategori).slice(0, parseInt(limit));
    
    // Transform data
    const pertanyaan = filteredRows.map(row => ({
      _id: row.id || `sheet_${row._rowNumber}`,
      pertanyaan: row.pertanyaan,
      pilihanJawaban: {
        a: row.pilihan_a,
        b: row.pilihan_b,
        c: row.pilihan_c,
        d: row.pilihan_d
      },
      jawabanBenar: row.jawaban_benar,
      kategori: row.kategori,
      tingkatKesulitan: row.tingkat_kesulitan || 'sedang',
      digunakan: parseInt(row.digunakan) || 0,
      tingkatKeberhasilan: parseFloat(row.tingkat_keberhasilan) || 0
    }));
    
    res.json({
      sukses: true,
      data: pertanyaan
    });
  } catch (error) {
    console.error('Error get pertanyaan by kategori from sheets:', error);
    res.status(500).json({ 
      sukses: false, 
      pesan: 'Terjadi kesalahan server!' 
    });
  }
});

// Get pertanyaan random dari Google Sheets
router.get('/random', async (req, res) => {
  try {
    // Initialize Google Sheets
    const connected = await googleSheetsService.initialize();
    if (!connected) {
      return res.status(500).json({ 
        sukses: false, 
        pesan: 'Gagal terhubung ke Google Sheets!' 
      });
    }

    // Get random question
    const pertanyaan = await googleSheetsService.getRandomQuestion();
    
    if (!pertanyaan) {
      return res.status(404).json({ 
        sukses: false, 
        pesan: 'Tidak ada pertanyaan tersedia!' 
      });
    }
    
    // Transform data
    const transformedPertanyaan = {
      _id: pertanyaan.id,
      pertanyaan: pertanyaan.pertanyaan,
      pilihanJawaban: pertanyaan.pilihanJawaban,
      jawabanBenar: pertanyaan.jawabanBenar,
      kategori: pertanyaan.kategori,
      tingkatKesulitan: pertanyaan.tingkatKesulitan,
      digunakan: 0,
      tingkatKeberhasilan: 0
    };
    
    res.json({
      sukses: true,
      data: transformedPertanyaan
    });
  } catch (error) {
    console.error('Error get pertanyaan random from sheets:', error);
    res.status(500).json({ 
      sukses: false, 
      pesan: 'Terjadi kesalahan server!' 
    });
  }
});

// Get statistik pertanyaan dari Google Sheets
router.get('/statistik', async (req, res) => {
  try {
    // Initialize Google Sheets
    const connected = await googleSheetsService.initialize();
    if (!connected) {
      return res.status(500).json({ 
        sukses: false, 
        pesan: 'Gagal terhubung ke Google Sheets!' 
      });
    }

    // Get semua pertanyaan
    const rows = await googleSheetsService.questionsSheet.getRows();
    
    // Hitung statistik
    const statistik = {
      totalPertanyaan: rows.length,
      pertanyaanAktif: rows.length,
      rataRataDigunakan: 0,
      rataRataKeberhasilan: 0
    };
    
    // Hitung statistik berdasarkan kategori
    const statistikKategori = {};
    rows.forEach(row => {
      const kategori = row.kategori || 'umum';
      if (!statistikKategori[kategori]) {
        statistikKategori[kategori] = {
          jumlah: 0,
          rataRataDigunakan: 0,
          rataRataKeberhasilan: 0
        };
      }
      statistikKategori[kategori].jumlah += 1;
    });
    
    // Convert ke array
    const statistikKategoriArray = Object.entries(statistikKategori).map(([kategori, data]) => ({
      _id: kategori,
      ...data
    }));
    
    res.json({
      sukses: true,
      data: {
        global: statistik,
        kategori: statistikKategoriArray
      }
    });
  } catch (error) {
    console.error('Error get statistik pertanyaan from sheets:', error);
    res.status(500).json({ 
      sukses: false, 
      pesan: 'Terjadi kesalahan server!' 
    });
  }
});

module.exports = router; 