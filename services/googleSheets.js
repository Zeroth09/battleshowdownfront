const { GoogleSpreadsheet } = require('google-spreadsheet');

class GoogleSheetsService {
  constructor() {
    this.doc = null;
    this.questionsSheet = null;
    this.playersSheet = null;
  }

  async initialize() {
    try {
      // Inisialisasi Google Sheets
      this.doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID);
      
      await this.doc.useServiceAccountAuth({
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      });

      await this.doc.loadInfo();

      console.log('✅ Google Sheets connected:', this.doc.title);

      // Load atau buat sheets
      this.questionsSheet = this.doc.sheetsByTitle['Questions'];
      this.playersSheet = this.doc.sheetsByTitle['Players'];
      
      if (!this.questionsSheet) {
        this.questionsSheet = await this.doc.addSheet({ title: 'Questions' });
      }
      
      if (!this.playersSheet) {
        this.playersSheet = await this.doc.addSheet({ title: 'Players' });
      }

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
      console.log('📝 Getting random question from Google Sheets...');
      const rows = await this.questionsSheet.getRows();
      console.log('📝 Total rows in Google Sheets:', rows.length);
      
      if (rows.length === 0) {
        console.log('📝 No rows found, using fallback question');
        return this.getFallbackQuestion();
      }

      const randomRow = rows[Math.floor(Math.random() * rows.length)];
      console.log('📝 Selected random row:', {
        id: randomRow.id,
        pertanyaan: randomRow.pertanyaan,
        pilihan_a: randomRow.pilihan_a,
        pilihan_b: randomRow.pilihan_b,
        pilihan_c: randomRow.pilihan_c,
        pilihan_d: randomRow.pilihan_d,
        jawaban_benar: randomRow.jawaban_benar
      });
      
      const question = {
        id: randomRow.id,
        pertanyaan: randomRow.pertanyaan,
        pilihanJawaban: {
          a: randomRow.pilihan_a,
          b: randomRow.pilihan_b,
          c: randomRow.pilihan_c,
          d: randomRow.pilihan_d
        },
        jawabanBenar: randomRow.jawaban_benar,
        kategori: randomRow.kategori,
        tingkatKesulitan: randomRow.tingkat_kesulitan
      };
      
      console.log('📝 Returning question:', question);
      return question;
    } catch (error) {
      console.error('❌ Error getting random question:', error.message);
      console.log('📝 Using fallback question due to error');
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
      let playerRow = rows.find(row => row.socket_id === socketId);

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
          playerRow[key] = playerInfo[key];
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
        const timestamp = new Date(row.timestamp);
        const now = new Date();
        const timeDiff = (now - timestamp) / 1000; // seconds

        // Consider player active if updated within last 30 seconds
        if (timeDiff <= 30) {
          players.push({
            socketId: row.socket_id,
            nama: row.nama,
            tim: row.tim,
            lokasi: {
              latitude: parseFloat(row.latitude) || 0,
              longitude: parseFloat(row.longitude) || 0
            },
            timestamp: row.timestamp
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
      const playerRow = rows.find(row => row.socket_id === socketId);
      
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
        const timestamp = new Date(row.timestamp);
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