const mongoose = require('mongoose');
const Pertanyaan = require('../models/pertanyaan');
require('dotenv').config();

// Data pertanyaan untuk seeding
const pertanyaanData = [
  // Kategori Umum
  {
    pertanyaan: "Ibu kota Indonesia adalah?",
    pilihanJawaban: {
      a: "Bandung",
      b: "Jakarta",
      c: "Surabaya",
      d: "Medan"
    },
    jawabanBenar: "b",
    kategori: "umum",
    tingkatKesulitan: "mudah"
  },
  {
    pertanyaan: "Berapa jumlah provinsi di Indonesia saat ini?",
    pilihanJawaban: {
      a: "32",
      b: "34",
      c: "36",
      d: "37"
    },
    jawabanBenar: "d",
    kategori: "umum",
    tingkatKesulitan: "sedang"
  },
  {
    pertanyaan: "Siapa presiden pertama Indonesia?",
    pilihanJawaban: {
      a: "Soeharto",
      b: "Soekarno",
      c: "Habibie",
      d: "Megawati"
    },
    jawabanBenar: "b",
    kategori: "sejarah",
    tingkatKesulitan: "mudah"
  },
  {
    pertanyaan: "Kapan Indonesia merdeka?",
    pilihanJawaban: {
      a: "16 Agustus 1945",
      b: "17 Agustus 1945",
      c: "18 Agustus 1945",
      d: "19 Agustus 1945"
    },
    jawabanBenar: "b",
    kategori: "sejarah",
    tingkatKesulitan: "mudah"
  },
  {
    pertanyaan: "Apa nama mata uang Indonesia?",
    pilihanJawaban: {
      a: "Dollar",
      b: "Rupiah",
      c: "Ringgit",
      d: "Baht"
    },
    jawabanBenar: "b",
    kategori: "umum",
    tingkatKesulitan: "mudah"
  },
  // Kategori Sains
  {
    pertanyaan: "Apa simbol kimia untuk emas?",
    pilihanJawaban: {
      a: "Ag",
      b: "Au",
      c: "Fe",
      d: "Cu"
    },
    jawabanBenar: "b",
    kategori: "sains",
    tingkatKesulitan: "sedang"
  },
  {
    pertanyaan: "Planet apa yang terbesar di tata surya?",
    pilihanJawaban: {
      a: "Mars",
      b: "Venus",
      c: "Jupiter",
      d: "Saturnus"
    },
    jawabanBenar: "c",
    kategori: "sains",
    tingkatKesulitan: "sedang"
  },
  {
    pertanyaan: "Berapa jumlah tulang dalam tubuh manusia dewasa?",
    pilihanJawaban: {
      a: "206",
      b: "212",
      c: "198",
      d: "220"
    },
    jawabanBenar: "a",
    kategori: "sains",
    tingkatKesulitan: "sedang"
  },
  // Kategori Teknologi
  {
    pertanyaan: "Siapa pendiri Microsoft?",
    pilihanJawaban: {
      a: "Steve Jobs",
      b: "Bill Gates",
      c: "Mark Zuckerberg",
      d: "Elon Musk"
    },
    jawabanBenar: "b",
    kategori: "teknologi",
    tingkatKesulitan: "mudah"
  },
  {
    pertanyaan: "Apa kepanjangan dari HTML?",
    pilihanJawaban: {
      a: "HyperText Markup Language",
      b: "High Tech Modern Language",
      c: "Home Tool Markup Language",
      d: "Hyperlink and Text Markup Language"
    },
    jawabanBenar: "a",
    kategori: "teknologi",
    tingkatKesulitan: "sedang"
  },
  {
    pertanyaan: "Tahun berapa iPhone pertama diluncurkan?",
    pilihanJawaban: {
      a: "2005",
      b: "2006",
      c: "2007",
      d: "2008"
    },
    jawabanBenar: "c",
    kategori: "teknologi",
    tingkatKesulitan: "sedang"
  },
  // Kategori Olahraga
  {
    pertanyaan: "Berapa pemain dalam satu tim sepak bola?",
    pilihanJawaban: {
      a: "9",
      b: "10",
      c: "11",
      d: "12"
    },
    jawabanBenar: "c",
    kategori: "olahraga",
    tingkatKesulitan: "mudah"
  },
  {
    pertanyaan: "Siapa pemain sepak bola dengan gelar 'The GOAT'?",
    pilihanJawaban: {
      a: "Cristiano Ronaldo",
      b: "Lionel Messi",
      c: "Pelé",
      d: "Maradona"
    },
    jawabanBenar: "b",
    kategori: "olahraga",
    tingkatKesulitan: "mudah"
  },
  {
    pertanyaan: "Olahraga apa yang menggunakan shuttlecock?",
    pilihanJawaban: {
      a: "Tenis",
      b: "Badminton",
      c: "Squash",
      d: "Ping Pong"
    },
    jawabanBenar: "b",
    kategori: "olahraga",
    tingkatKesulitan: "mudah"
  },
  // Kategori Hiburan
  {
    pertanyaan: "Siapa aktor yang memerankan Iron Man?",
    pilihanJawaban: {
      a: "Chris Evans",
      b: "Robert Downey Jr.",
      c: "Chris Hemsworth",
      d: "Mark Ruffalo"
    },
    jawabanBenar: "b",
    kategori: "hiburan",
    tingkatKesulitan: "mudah"
  },
  {
    pertanyaan: "Film apa yang memenangkan Oscar Best Picture 2024?",
    pilihanJawaban: {
      a: "Oppenheimer",
      b: "Barbie",
      c: "Killers of the Flower Moon",
      d: "Poor Things"
    },
    jawabanBenar: "a",
    kategori: "hiburan",
    tingkatKesulitan: "sedang"
  },
  {
    pertanyaan: "Siapa penyanyi dengan lagu 'Shape of You'?",
    pilihanJawaban: {
      a: "Justin Bieber",
      b: "Ed Sheeran",
      c: "Shawn Mendes",
      d: "Charlie Puth"
    },
    jawabanBenar: "b",
    kategori: "hiburan",
    tingkatKesulitan: "mudah"
  },
  // Pertanyaan Sulit
  {
    pertanyaan: "Tahun berapa Perang Dunia II berakhir?",
    pilihanJawaban: {
      a: "1943",
      b: "1944",
      c: "1945",
      d: "1946"
    },
    jawabanBenar: "c",
    kategori: "sejarah",
    tingkatKesulitan: "sulit"
  },
  {
    pertanyaan: "Apa nama sungai terpanjang di dunia?",
    pilihanJawaban: {
      a: "Sungai Nil",
      b: "Sungai Amazon",
      c: "Sungai Yangtze",
      d: "Sungai Mississippi"
    },
    jawabanBenar: "a",
    kategori: "umum",
    tingkatKesulitan: "sulit"
  },
  {
    pertanyaan: "Berapa jumlah kromosom manusia?",
    pilihanJawaban: {
      a: "42",
      b: "44",
      c: "46",
      d: "48"
    },
    jawabanBenar: "c",
    kategori: "sains",
    tingkatKesulitan: "sulit"
  },
  {
    pertanyaan: "Apa nama bahasa pemrograman yang dibuat oleh Google?",
    pilihanJawaban: {
      a: "Python",
      b: "Java",
      c: "Go",
      d: "Rust"
    },
    jawabanBenar: "c",
    kategori: "teknologi",
    tingkatKesulitan: "sulit"
  }
];

async function seedPertanyaan() {
  try {
    // Connect ke database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/battle-games', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('🔄 Terhubung ke database...');
    
    // Hapus data pertanyaan yang ada (opsional)
    await Pertanyaan.deleteMany({});
    console.log('🗑️ Data pertanyaan lama dihapus...');
    
    // Insert data pertanyaan baru
    const pertanyaanInserted = await Pertanyaan.insertMany(pertanyaanData);
    console.log(`✅ ${pertanyaanInserted.length} pertanyaan berhasil ditambahkan!`);
    
    // Tampilkan statistik
    const statistik = await Pertanyaan.aggregate([
      {
        $group: {
          _id: '$kategori',
          jumlah: { $sum: 1 }
        }
      }
    ]);
    
    console.log('\n📊 Statistik pertanyaan:');
    statistik.forEach(stat => {
      console.log(`   ${stat._id}: ${stat.jumlah} pertanyaan`);
    });
    
    console.log('\n🎉 Seeding selesai!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error saat seeding:', error);
    process.exit(1);
  }
}

// Jalankan seeding
seedPertanyaan(); 