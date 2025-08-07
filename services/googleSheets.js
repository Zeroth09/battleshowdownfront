const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');

class GoogleSheetsService {
  constructor() {
    this.doc = null;
    this.questionsSheet = null;
    this.playersSheet = null;
  }

  async initialize() {
    try {
      // Inisialisasi Google Sheets
      const serviceAccountAuth = new JWT({
        email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });

      this.doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, serviceAccountAuth);
      await this.doc.loadInfo();

      console.log('✅ Google Sheets connected:', this.doc.title);

      // Load atau buat sheets
      this.questionsSheet = this.doc.sheetsByTitle['Questions'] || await this.doc.addSheet({ title: 'Questions' });
      this.playersSheet = this.doc.sheetsByTitle['Players'] || await this.doc.addSheet({ title: 'Players' });

      // Setup headers jika sheet kosong
      await this.setupHeaders();

      return true;
    } catch (error) {
      console.error('❌ Google Sheets connection error:', error.message);
      return false;
    }
  }

  async setupHeaders() {
    try {
      // Setup headers untuk Questions sheet
      await this.questionsSheet.loadHeaderRow();
      if (this.questionsSheet.headerValues.length === 0) {
        await this.questionsSheet.setHeaderRow([
          'id', 'pertanyaan', 'pilihan_a', 'pilihan_b', 'pilihan_c', 'pilihan_d', 
          'jawaban_benar', 'kategori', 'tingkat_kesulitan'
        ]);
      }

      // Setup headers untuk Players sheet
      await this.playersSheet.loadHeaderRow();
      if (this.playersSheet.headerValues.length === 0) {
        await this.playersSheet.setHeaderRow([
          'socket_id', 'nama', 'tim', 'latitude', 'longitude', 'timestamp', 'status'
        ]);
      }
    } catch (error) {
      console.error('❌ Error setting up headers:', error.message);
    }
  }

  // Questions methods
  async getRandomQuestion() {
    try {
      const rows = await this.questionsSheet.getRows();
      if (rows.length === 0) {
        return this.getFallbackQuestion();
      }

      const randomRow = rows[Math.floor(Math.random() * rows.length)];
      
      return {
        id: randomRow.get('id'),
        pertanyaan: randomRow.get('pertanyaan'),
        pilihanJawaban: {
          a: randomRow.get('pilihan_a'),
          b: randomRow.get('pilihan_b'),
          c: randomRow.get('pilihan_c'),
          d: randomRow.get('pilihan_d')
        },
        jawabanBenar: randomRow.get('jawaban_benar'),
        kategori: randomRow.get('kategori'),
        tingkatKesulitan: randomRow.get('tingkat_kesulitan')
      };
    } catch (error) {
      console.error('❌ Error getting random question:', error.message);
      return this.getFallbackQuestion();
    }
  }

  getFallbackQuestion() {
    return {
      id: 'fallback_1',
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
    };
  }

  async addQuestion(questionData) {
    try {
      await this.questionsSheet.addRow({
        id: questionData.id || `q_${Date.now()}`,
        pertanyaan: questionData.pertanyaan,
        pilihan_a: questionData.pilihanJawaban.a,
        pilihan_b: questionData.pilihanJawaban.b,
        pilihan_c: questionData.pilihanJawaban.c,
        pilihan_d: questionData.pilihanJawaban.d,
        jawaban_benar: questionData.jawabanBenar,
        kategori: questionData.kategori || 'umum',
        tingkat_kesulitan: questionData.tingkatKesulitan || 'mudah'
      });
      return true;
    } catch (error) {
      console.error('❌ Error adding question:', error.message);
      return false;
    }
  }

  // Players methods
  async updatePlayerLocation(socketId, playerData) {
    try {
      const rows = await this.playersSheet.getRows();
      let playerRow = rows.find(row => row.get('socket_id') === socketId);

      const playerInfo = {
        socket_id: socketId,
        nama: playerData.nama,
        tim: playerData.tim,
        latitude: playerData.lokasi?.latitude || 0,
        longitude: playerData.lokasi?.longitude || 0,
        timestamp: new Date().toISOString(),
        status: 'online'
      };

      if (playerRow) {
        // Update existing player
        Object.keys(playerInfo).forEach(key => {
          playerRow.set(key, playerInfo[key]);
        });
        await playerRow.save();
      } else {
        // Add new player
        await this.playersSheet.addRow(playerInfo);
      }
      
      return true;
    } catch (error) {
      console.error('❌ Error updating player location:', error.message);
      return false;
    }
  }

  async getActivePlayers() {
    try {
      const rows = await this.playersSheet.getRows();
      const players = [];

      for (const row of rows) {
        const timestamp = new Date(row.get('timestamp'));
        const now = new Date();
        const timeDiff = (now - timestamp) / 1000; // seconds

        // Consider player active if updated within last 30 seconds
        if (timeDiff <= 30) {
          players.push({
            socketId: row.get('socket_id'),
            nama: row.get('nama'),
            tim: row.get('tim'),
            lokasi: {
              latitude: parseFloat(row.get('latitude')) || 0,
              longitude: parseFloat(row.get('longitude')) || 0
            },
            timestamp: row.get('timestamp')
          });
        }
      }

      return players;
    } catch (error) {
      console.error('❌ Error getting active players:', error.message);
      return [];
    }
  }

  async removePlayer(socketId) {
    try {
      const rows = await this.playersSheet.getRows();
      const playerRow = rows.find(row => row.get('socket_id') === socketId);
      
      if (playerRow) {
        await playerRow.delete();
      }
      
      return true;
    } catch (error) {
      console.error('❌ Error removing player:', error.message);
      return false;
    }
  }

  async clearInactivePlayers() {
    try {
      const rows = await this.playersSheet.getRows();
      const now = new Date();

      for (const row of rows) {
        const timestamp = new Date(row.get('timestamp'));
        const timeDiff = (now - timestamp) / 1000; // seconds

        // Remove players inactive for more than 1 minute
        if (timeDiff > 60) {
          await row.delete();
        }
      }

      return true;
    } catch (error) {
      console.error('❌ Error clearing inactive players:', error.message);
      return false;
    }
  }
}

module.exports = new GoogleSheetsService(); 