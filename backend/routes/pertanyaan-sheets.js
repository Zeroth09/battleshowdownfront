const express = require('express');
const router = express.Router();

// Get semua pertanyaan dari Google Sheets
router.get('/', (req, res) => {
  console.log('✅ Endpoint pertanyaan/sheets dipanggil');
  
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
    },
    {
      _id: 'sample_2',
      pertanyaan: 'Siapa presiden pertama Indonesia?',
      pilihanJawaban: {
        a: 'Soekarno',
        b: 'Soeharto',
        c: 'Habibie',
        d: 'Megawati'
      },
      jawabanBenar: 'a',
      kategori: 'sejarah',
      tingkatKesulitan: 'mudah',
      digunakan: 0,
      tingkatKeberhasilan: 0
    },
    {
      _id: 'sample_3',
      pertanyaan: 'Berapa hasil dari 7 x 8?',
      pilihanJawaban: {
        a: '54',
        b: '56',
        c: '58',
        d: '60'
      },
      jawabanBenar: 'b',
      kategori: 'matematika',
      tingkatKesulitan: 'mudah',
      digunakan: 0,
      tingkatKeberhasilan: 0
    }
  ];

  console.log('✅ Mengirim sample data:', samplePertanyaan.length, 'pertanyaan');
  
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
});

// POST - Tambah pertanyaan baru ke Google Sheets
router.post('/', (req, res) => {
  console.log('⚠️ Google Sheets not configured, cannot add question');
  return res.status(500).json({ 
    sukses: false, 
    pesan: 'Google Sheets tidak tersedia untuk development!' 
  });
});

// Get pertanyaan berdasarkan kategori dari Google Sheets
router.get('/kategori/:kategori', (req, res) => {
  const { kategori } = req.params;
  console.log('✅ Endpoint kategori dipanggil untuk:', kategori);
  
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
});

// Get pertanyaan random dari Google Sheets
router.get('/random', (req, res) => {
  console.log('✅ Endpoint random dipanggil');
  
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
});

// Get statistik pertanyaan dari Google Sheets
router.get('/statistik', (req, res) => {
  console.log('✅ Endpoint statistik dipanggil');
  
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
});

module.exports = router; 