const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server'); // Import app dari server.js

describe('Battle Showdown Backend Tests', () => {
  beforeAll(async () => {
    // Connect ke test database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/battle-games-test');
  });

  afterAll(async () => {
    // Disconnect dari database
    await mongoose.connection.close();
  });

  describe('API Endpoints', () => {
    test('GET /api/pertanyaan/random - should return random question', async () => {
      const response = await request(app)
        .get('/api/pertanyaan/random')
        .expect(200);

      expect(response.body.sukses).toBe(true);
      expect(response.body.data).toHaveProperty('pertanyaan');
      expect(response.body.data).toHaveProperty('pilihanJawaban');
      expect(response.body.data).toHaveProperty('jawabanBenar');
    });

    test('GET /api/pemain/leaderboard - should return leaderboard', async () => {
      const response = await request(app)
        .get('/api/pemain/leaderboard')
        .expect(200);

      expect(response.body.sukses).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('GET /api/battle/statistik-global - should return global stats', async () => {
      const response = await request(app)
        .get('/api/battle/statistik-global')
        .expect(200);

      expect(response.body.sukses).toBe(true);
      expect(response.body.data).toHaveProperty('global');
      expect(response.body.data).toHaveProperty('tim');
    });

    test('GET /api/pertanyaan/kategori/umum - should return questions by category', async () => {
      const response = await request(app)
        .get('/api/pertanyaan/kategori/umum')
        .expect(200);

      expect(response.body.sukses).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('Database Models', () => {
    test('Pertanyaan model should have required fields', () => {
      const Pertanyaan = require('../models/pertanyaan');
      const pertanyaan = new Pertanyaan({
        pertanyaan: 'Test pertanyaan?',
        pilihanJawaban: {
          a: 'Jawaban A',
          b: 'Jawaban B',
          c: 'Jawaban C',
          d: 'Jawaban D'
        },
        jawabanBenar: 'a',
        kategori: 'umum',
        tingkatKesulitan: 'mudah'
      });

      expect(pertanyaan.pertanyaan).toBe('Test pertanyaan?');
      expect(pertanyaan.pilihanJawaban.a).toBe('Jawaban A');
      expect(pertanyaan.jawabanBenar).toBe('a');
      expect(pertanyaan.kategori).toBe('umum');
    });

    test('Pemain model should have required fields', () => {
      const Pemain = require('../models/pemain');
      const pemain = new Pemain({
        nama: 'Test Pemain',
        email: 'test@example.com',
        password: 'password123',
        tim: 'merah'
      });

      expect(pemain.nama).toBe('Test Pemain');
      expect(pemain.email).toBe('test@example.com');
      expect(pemain.tim).toBe('merah');
    });
  });

  describe('Utility Functions', () => {
    test('hitungJarak function should calculate distance correctly', () => {
      // Import function dari server.js
      const { hitungJarak } = require('../server');
      
      // Test coordinates (Jakarta)
      const lat1 = -6.2088;
      const lon1 = 106.8456;
      const lat2 = -6.2089;
      const lon2 = 106.8457;
      
      const jarak = hitungJarak(lat1, lon1, lat2, lon2);
      
      expect(jarak).toBeGreaterThan(0);
      expect(jarak).toBeLessThan(100); // Should be less than 100 meters
    });
  });
}); 