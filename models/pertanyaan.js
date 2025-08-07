const mongoose = require('mongoose');

const pertanyaanSchema = new mongoose.Schema({
  pertanyaan: {
    type: String,
    required: true,
    trim: true
  },
  pilihanJawaban: {
    a: {
      type: String,
      required: true,
      trim: true
    },
    b: {
      type: String,
      required: true,
      trim: true
    },
    c: {
      type: String,
      required: true,
      trim: true
    },
    d: {
      type: String,
      required: true,
      trim: true
    }
  },
  jawabanBenar: {
    type: String,
    enum: ['a', 'b', 'c', 'd'],
    required: true
  },
  kategori: {
    type: String,
    enum: ['umum', 'sejarah', 'sains', 'teknologi', 'olahraga', 'hiburan'],
    default: 'umum'
  },
  tingkatKesulitan: {
    type: String,
    enum: ['mudah', 'sedang', 'sulit'],
    default: 'sedang'
  },
  penjelasan: {
    type: String,
    trim: true
  },
  digunakan: {
    type: Number,
    default: 0
  },
  tingkatKeberhasilan: {
    type: Number,
    default: 0 // Persentase jawaban benar
  },
  aktif: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index untuk pencarian berdasarkan kategori dan tingkat kesulitan
pertanyaanSchema.index({ kategori: 1, tingkatKesulitan: 1 });
pertanyaanSchema.index({ aktif: 1 });

// Method untuk update statistik pertanyaan
pertanyaanSchema.methods.updateStatistik = function(jawabanBenar) {
  this.digunakan += 1;
  
  if (jawabanBenar) {
    this.tingkatKeberhasilan = ((this.tingkatKeberhasilan * (this.digunakan - 1)) + 100) / this.digunakan;
  } else {
    this.tingkatKeberhasilan = (this.tingkatKeberhasilan * (this.digunakan - 1)) / this.digunakan;
  }
  
  return this.save();
};

// Static method untuk mendapatkan pertanyaan random
pertanyaanSchema.statics.getPertanyaanRandom = function() {
  return this.aggregate([
    { $match: { aktif: true } },
    { $sample: { size: 1 } }
  ]);
};

// Static method untuk mendapatkan pertanyaan berdasarkan kategori
pertanyaanSchema.statics.getPertanyaanByKategori = function(kategori, limit = 10) {
  return this.find({ 
    kategori, 
    aktif: true 
  }).limit(limit);
};

module.exports = mongoose.model('Pertanyaan', pertanyaanSchema); 