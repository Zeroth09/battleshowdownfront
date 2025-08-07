const mongoose = require('mongoose');

const pemainSchema = new mongoose.Schema({
  nama: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  tim: {
    type: String,
    enum: ['merah', 'putih'],
    required: true
  },
  password: {
    type: String,
    required: true
  },
  lokasi: {
    latitude: {
      type: Number,
      default: null
    },
    longitude: {
      type: Number,
      default: null
    },
    timestamp: {
      type: Date,
      default: null
    }
  },
  statistik: {
    totalBattle: {
      type: Number,
      default: 0
    },
    menang: {
      type: Number,
      default: 0
    },
    kalah: {
      type: Number,
      default: 0
    },
    skor: {
      type: Number,
      default: 0
    }
  },
  status: {
    type: String,
    enum: ['online', 'offline', 'dalam-battle'],
    default: 'offline'
  },
  terakhirAktif: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index untuk pencarian berdasarkan tim
pemainSchema.index({ tim: 1 });
pemainSchema.index({ status: 1 });

// Method untuk update statistik setelah battle
pemainSchema.methods.updateStatistik = function(hasil) {
  this.statistik.totalBattle += 1;
  
  if (hasil === 'menang') {
    this.statistik.menang += 1;
    this.statistik.skor += 10;
  } else {
    this.statistik.kalah += 1;
    this.statistik.skor = Math.max(0, this.statistik.skor - 5);
  }
  
  return this.save();
};

// Method untuk update lokasi
pemainSchema.methods.updateLokasi = function(latitude, longitude) {
  this.lokasi = {
    latitude,
    longitude,
    timestamp: new Date()
  };
  this.terakhirAktif = new Date();
  return this.save();
};

module.exports = mongoose.model('Pemain', pemainSchema); 