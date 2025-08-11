const express = require('express');
const router = express.Router();
const googleSheetsService = require('../services/googleSheets');

// Test endpoint untuk debugging
router.get('/test', async (req, res) => {
  try {
    console.log('🔧 Testing Google Sheets connection...');
    console.log('GOOGLE_SHEET_ID:', process.env.GOOGLE_SHEET_ID);
    console.log('GOOGLE_SERVICE_ACCOUNT_EMAIL:', process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL);
    console.log('GOOGLE_PRIVATE_KEY length:', process.env.GOOGLE_PRIVATE_KEY ? process.env.GOOGLE_PRIVATE_KEY.length : 'Not set');
    
    const connected = await googleSheetsService.initialize();
    console.log('✅ Google Sheets connection result:', connected);
    
    res.json({
      sukses: true,
      message: 'Test completed',
      env_vars: {
        sheet_id: process.env.GOOGLE_SHEET_ID ? 'Set' : 'Not set',
        email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ? 'Set' : 'Not set',
        private_key: process.env.GOOGLE_PRIVATE_KEY ? 'Set' : 'Not set'
      },
      connection_result: connected
    });
  } catch (error) {
    console.error('❌ Test error:', error);
    res.status(500).json({
      sukses: false,
      error: error.message,
      stack: error.stack
    });
  }
});

// Get semua pertanyaan dari Google Sheets
router.get('/', async (req, res) => {
  try {
    console.log('✅ Endpoint pertanyaan/sheets dipanggil');
    
    // Initialize Google Sheets
    const connected = await googleSheetsService.initialize();
    if (!connected) {
      console.log('❌ Gagal terhubung ke Google Sheets, returning sample data');
      
      // Return sample data as fallback
      const samplePertanyaan = [
        {
          _id: 'sample_1',
          pertanyaan: 'Ibu kota Indonesia adalah?',
          pilihanJawaban: {
            a: 'Jakarta',
            b: 'Bandung',
            c: 'Surabaya',
            d: 'Yogyakarta'
          },
          jawabanBenar: 'a',
          kategori: 'geografi',
          tingkatKesulitan: 'mudah',
          digunakan: 0,
          tingkatKeberhasilan: 0
        }
      ];

      return res.json({
        sukses: true,
        data: samplePertanyaan,
        pagination: {
          page: 1,
          limit: 20,
          total: samplePertanyaan.length,
          pages: 1
        }
      });
    }

    // Get semua pertanyaan dari sheets
    const rows = await googleSheetsService.questionsSheet.getRows();
    console.log('✅ Berhasil membaca', rows.length, 'pertanyaan dari Google Sheets');
    
    // Transform data ke format yang diharapkan frontend
    const pertanyaan = rows.map(row => ({
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
      digunakan: 0,
      tingkatKeberhasilan: 0
    }));
    
    res.json({
      sukses: true,
      data: pertanyaan,
      pagination: {
        page: 1,
        limit: 20,
        total: pertanyaan.length,
        pages: 1
      }
    });
  } catch (error) {
    console.error('❌ Error get pertanyaan:', error);
    
    // Return sample data as fallback
    const samplePertanyaan = [
      {
        _id: 'sample_1',
        pertanyaan: 'Ibu kota Indonesia adalah?',
        pilihanJawaban: {
          a: 'Jakarta',
          b: 'Bandung',
          c: 'Surabaya',
          d: 'Yogyakarta'
        },
        jawabanBenar: 'a',
        kategori: 'geografi',
        tingkatKesulitan: 'mudah',
        digunakan: 0,
        tingkatKeberhasilan: 0
      }
    ];

    res.json({
      sukses: true,
      data: samplePertanyaan,
      pagination: {
        page: 1,
        limit: 20,
        total: samplePertanyaan.length,
        pages: 1
      }
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
    console.log('✅ Endpoint kategori dipanggil untuk:', kategori);
    
    // Initialize Google Sheets
    const connected = await googleSheetsService.initialize();
    if (!connected) {
      console.log('❌ Gagal terhubung ke Google Sheets, returning sample data');
      
      // Return sample data for development
      const samplePertanyaan = [
        {
          _id: 'sample_1',
          pertanyaan: 'Ibu kota Indonesia adalah?',
          pilihanJawaban: {
            a: 'Jakarta',
            b: 'Bandung',
            c: 'Surabaya',
            d: 'Yogyakarta'
          },
          jawabanBenar: 'a',
          kategori: 'geografi',
          tingkatKesulitan: 'mudah',
          digunakan: 0,
          tingkatKeberhasilan: 0
        }
      ];

      const filteredPertanyaan = samplePertanyaan.filter(q => q.kategori === kategori);
      
      return res.json({
        sukses: true,
        data: filteredPertanyaan
      });
    }

    // Get pertanyaan berdasarkan kategori
    const rows = await googleSheetsService.questionsSheet.getRows();
    const filteredRows = rows.filter(row => row.kategori === kategori);
    
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
      digunakan: 0,
      tingkatKeberhasilan: 0
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
    console.log('✅ Endpoint random dipanggil');
    
    // Initialize Google Sheets
    const connected = await googleSheetsService.initialize();
    if (!connected) {
      console.log('❌ Gagal terhubung ke Google Sheets, returning sample question');
      
      // Return sample question for development
      const sampleQuestion = {
        _id: 'sample_random',
        pertanyaan: 'Ibu kota Indonesia adalah?',
        pilihanJawaban: {
          a: 'Jakarta',
          b: 'Bandung',
          c: 'Surabaya',
          d: 'Yogyakarta'
        },
        jawabanBenar: 'a',
        kategori: 'geografi',
        tingkatKesulitan: 'mudah',
        digunakan: 0,
        tingkatKeberhasilan: 0
      };
      
      return res.json({
        sukses: true,
        data: sampleQuestion
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
    console.log('✅ Endpoint statistik dipanggil');
    
    // Initialize Google Sheets
    const connected = await googleSheetsService.initialize();
    if (!connected) {
      console.log('❌ Gagal terhubung ke Google Sheets, returning sample stats');
      
      // Return sample stats for development
      const sampleStats = {
        global: {
          totalPertanyaan: 3,
          pertanyaanAktif: 3,
          rataRataDigunakan: 0,
          rataRataKeberhasilan: 0
        },
        kategori: [
          { _id: 'geografi', jumlah: 1, rataRataDigunakan: 0, rataRataKeberhasilan: 0 },
          { _id: 'sejarah', jumlah: 1, rataRataDigunakan: 0, rataRataKeberhasilan: 0 },
          { _id: 'matematika', jumlah: 1, rataRataDigunakan: 0, rataRataKeberhasilan: 0 }
        ]
      };
      
      return res.json({
        sukses: true,
        data: sampleStats
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