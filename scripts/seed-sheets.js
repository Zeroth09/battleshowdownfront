const googleSheetsService = require('../services/googleSheets');

const sampleQuestions = [
  {
    pertanyaan: 'Ibu kota Indonesia adalah?',
    pilihanJawaban: {
      a: 'Jakarta',
      b: 'Bandung',
      c: 'Surabaya',
      d: 'Yogyakarta'
    },
    jawabanBenar: 'a',
    kategori: 'umum',
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
  }
];

async function seedQuestions() {
  try {
    console.log('🌱 Starting to seed questions to Google Sheets...');
    
    // Initialize Google Sheets
    const connected = await googleSheetsService.initialize();
    if (!connected) {
      console.error('❌ Failed to connect to Google Sheets');
      return;
    }
    
    // Add all questions
    for (let i = 0; i < sampleQuestions.length; i++) {
      const question = sampleQuestions[i];
      const success = await googleSheetsService.addQuestion(question);
      
      if (success) {
        console.log(`✅ Added question ${i + 1}: ${question.pertanyaan}`);
      } else {
        console.log(`❌ Failed to add question ${i + 1}`);
      }
    }
    
    console.log('🎉 Seeding completed!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error seeding questions:', error);
    process.exit(1);
  }
}

seedQuestions(); 