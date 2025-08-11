const googleSheetsService = require('../services/googleSheets');

// Pertanyaan dari spreadsheet yang sudah ada
const pertanyaanDariSpreadsheet = [
  {
    pertanyaan: 'Ibu kota Indonesia adalah?',
    pilihanJawaban: {
      a: 'Jakarta',
      b: 'Bandung',
      c: 'Surabaya',
      d: 'Yogyakarta'
    },
    jawabanBenar: 'a',
    kategori: 'geografi',
    tingkatKesulitan: 'mudah'
  },
  {
    pertanyaan: 'Planet terbesar di tata surya adalah?',
    pilihanJawaban: {
      a: 'Mars',
      b: 'Jupiter',
      c: 'Saturnus',
      d: 'Neptunus'
    },
    jawabanBenar: 'b',
    kategori: 'sains',
    tingkatKesulitan: 'mudah'
  },
  {
    pertanyaan: 'Siapa penemu bola lampu?',
    pilihanJawaban: {
      a: 'Albert Einstein',
      b: 'Thomas Edison',
      c: 'Nikola Tesla',
      d: 'Benjamin Franklin'
    },
    jawabanBenar: 'b',
    kategori: 'sejarah',
    tingkatKesulitan: 'sedang'
  },
  {
    pertanyaan: 'Berapa hasil dari 15 + 27?',
    pilihanJawaban: {
      a: '40',
      b: '41',
      c: '42',
      d: '43'
    },
    jawabanBenar: 'c',
    kategori: 'matematika',
    tingkatKesulitan: 'mudah'
  },
  {
    pertanyaan: 'Bahasa pemrograman yang dibuat oleh Google adalah?',
    pilihanJawaban: {
      a: 'Python',
      b: 'Go',
      c: 'Java',
      d: 'JavaScript'
    },
    jawabanBenar: 'b',
    kategori: 'teknologi',
    tingkatKesulitan: 'sedang'
  },
  {
    pertanyaan: 'Gunung tertinggi di Indonesia adalah?',
    pilihanJawaban: {
      a: 'Gunung Semeru',
      b: 'Gunung Merapi',
      c: 'Puncak Jaya',
      d: 'Gunung Rinjani'
    },
    jawabanBenar: 'c',
    kategori: 'geografi',
    tingkatKesulitan: 'sedang'
  },
  {
    pertanyaan: 'Siapa presiden pertama Indonesia?',
    pilihanJawaban: {
      a: 'Soekarno',
      b: 'Soeharto',
      c: 'Habibie',
      d: 'Megawati'
    },
    jawabanBenar: 'a',
    kategori: 'sejarah',
    tingkatKesulitan: 'mudah'
  },
  {
    pertanyaan: 'Berapa jumlah provinsi di Indonesia saat ini?',
    pilihanJawaban: {
      a: '32',
      b: '33',
      c: '34',
      d: '35'
    },
    jawabanBenar: 'c',
    kategori: 'umum',
    tingkatKesulitan: 'sedang'
  },
  {
    pertanyaan: 'Browser web yang dibuat oleh Google adalah?',
    pilihanJawaban: {
      a: 'Firefox',
      b: 'Safari',
      c: 'Chrome',
      d: 'Edge'
    },
    jawabanBenar: 'c',
    kategori: 'teknologi',
    tingkatKesulitan: 'mudah'
  },
  {
    pertanyaan: 'Siapa yang menulis novel "Laskar Pelangi"?',
    pilihanJawaban: {
      a: 'Andrea Hirata',
      b: 'Habiburrahman El Shirazy',
      c: 'Tere Liye',
      d: 'Dee Lestari'
    },
    jawabanBenar: 'a',
    kategori: 'sastra',
    tingkatKesulitan: 'sedang'
  },
  {
    pertanyaan: 'Apa nama ibukota provinsi Jawa Barat?',
    pilihanJawaban: {
      a: 'Bandung',
      b: 'Semarang',
      c: 'Surabaya',
      d: 'Yogyakarta'
    },
    jawabanBenar: 'a',
    kategori: 'geografi',
    tingkatKesulitan: 'mudah'
  },
  {
    pertanyaan: 'Berapa jumlah pemain dalam satu tim sepak bola?',
    pilihanJawaban: {
      a: '9',
      b: '10',
      c: '11',
      d: '12'
    },
    jawabanBenar: 'c',
    kategori: 'olahraga',
    tingkatKesulitan: 'mudah'
  },
  {
    pertanyaan: 'Siapa penulis lagu "Indonesia Raya"?',
    pilihanJawaban: {
      a: 'W.R. Supratman',
      b: 'Ismail Marzuki',
      c: 'Gesang',
      d: 'Kusbini'
    },
    jawabanBenar: 'a',
    kategori: 'sejarah',
    tingkatKesulitan: 'sedang'
  },
  {
    pertanyaan: 'Berapa hasil dari 8 x 7?',
    pilihanJawaban: {
      a: '54',
      b: '56',
      c: '58',
      d: '60'
    },
    jawabanBenar: 'b',
    kategori: 'matematika',
    tingkatKesulitan: 'mudah'
  },
  {
    pertanyaan: 'Apa nama mata uang Jepang?',
    pilihanJawaban: {
      a: 'Won',
      b: 'Yen',
      c: 'Ringgit',
      d: 'Baht'
    },
    jawabanBenar: 'b',
    kategori: 'umum',
    tingkatKesulitan: 'mudah'
  }
];

async function importPertanyaan() {
  try {
    console.log('🌱 Starting to import questions from spreadsheet to Google Sheets...');
    
    // Initialize Google Sheets
    const connected = await googleSheetsService.initialize();
    if (!connected) {
      console.error('❌ Failed to connect to Google Sheets');
      return;
    }
    
    console.log('✅ Connected to Google Sheets successfully');
    
    // Clear existing questions first (optional)
    console.log('🧹 Clearing existing questions...');
    const existingRows = await googleSheetsService.questionsSheet.getRows();
    for (const row of existingRows) {
      await row.delete();
    }
    console.log(`✅ Cleared ${existingRows.length} existing questions`);
    
    // Add all questions from spreadsheet
    console.log('📝 Adding questions from spreadsheet...');
    for (let i = 0; i < pertanyaanDariSpreadsheet.length; i++) {
      const question = pertanyaanDariSpreadsheet[i];
      const success = await googleSheetsService.addQuestion(question);
      
      if (success) {
        console.log(`✅ Added question ${i + 1}: ${question.pertanyaan}`);
      } else {
        console.log(`❌ Failed to add question ${i + 1}`);
      }
      
      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('🎉 Import completed successfully!');
    console.log(`📊 Total questions imported: ${pertanyaanDariSpreadsheet.length}`);
    
    // Verify the import
    const finalRows = await googleSheetsService.questionsSheet.getRows();
    console.log(`📋 Final count in Google Sheets: ${finalRows.length} questions`);
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error importing questions:', error);
    process.exit(1);
  }
}

// Run the import
importPertanyaan(); 