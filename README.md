# 🎮 Backend Battle Showdown Games

Backend untuk games battle showdown dengan sistem deteksi pemain real-time menggunakan Socket.IO dan MongoDB.

## 🚀 Fitur Utama

- **Sistem Deteksi Pemain**: Deteksi jarak antar pemain menggunakan GPS dengan akurasi 1 meter
- **Battle Showdown**: Pertempuran otomatis ketika pemain lawan bertemu
- **Real-time Communication**: Menggunakan Socket.IO untuk komunikasi real-time
- **Autentikasi JWT**: Sistem login/register yang aman
- **Database MongoDB**: Penyimpanan data pemain dan pertanyaan
- **API RESTful**: Endpoint untuk manajemen data

## 🛠️ Teknologi yang Digunakan

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Socket.IO** - Real-time communication
- **MongoDB** - Database
- **Mongoose** - ODM untuk MongoDB
- **JWT** - Autentikasi
- **bcryptjs** - Password hashing

## 📋 Prerequisites

- Node.js (v14 atau lebih baru)
- MongoDB (local atau cloud)
- npm atau yarn

## 🔧 Instalasi

1. **Clone repository**
```bash
git clone <repository-url>
cd backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Setup environment variables**
```bash
cp env.example .env
```

Edit file `.env` dengan konfigurasi yang sesuai:
```env
MONGODB_URI=mongodb://localhost:27017/battle-games
JWT_SECRET=rahasia-jwt-super-secret-key
PORT=5000
FRONTEND_URL=http://localhost:3000
```

4. **Seed data pertanyaan (opsional)**
```bash
npm run seed
```

5. **Jalankan server**
```bash
# Development
npm run dev

# Production
npm start
```

## 🗄️ Database Schema

### Model Pemain
```javascript
{
  nama: String,
  email: String,
  password: String,
  tim: String, // 'merah' atau 'putih'
  lokasi: {
    latitude: Number,
    longitude: Number,
    timestamp: Date
  },
  statistik: {
    totalBattle: Number,
    menang: Number,
    kalah: Number,
    skor: Number
  },
  status: String // 'online', 'offline', 'dalam-battle'
}
```

### Model Pertanyaan
```javascript
{
  pertanyaan: String,
  pilihanJawaban: {
    a: String,
    b: String,
    c: String,
    d: String
  },
  jawabanBenar: String, // 'a', 'b', 'c', atau 'd'
  kategori: String, // 'umum', 'sejarah', 'sains', dll
  tingkatKesulitan: String // 'mudah', 'sedang', 'sulit'
}
```

## 🔌 API Endpoints

### Autentikasi
- `POST /api/auth/register` - Register pemain baru
- `POST /api/auth/login` - Login pemain
- `POST /api/auth/logout` - Logout pemain
- `GET /api/auth/verify` - Verifikasi token

### Pemain
- `GET /api/pemain/profil` - Get profil pemain
- `POST /api/pemain/update-lokasi` - Update lokasi pemain
- `GET /api/pemain/online/:tim` - Get pemain online berdasarkan tim
- `GET /api/pemain/statistik-tim/:tim` - Get statistik tim
- `PUT /api/pemain/profil` - Update profil pemain
- `GET /api/pemain/leaderboard` - Get leaderboard

### Battle
- `GET /api/battle/riwayat` - Get riwayat battle pemain
- `POST /api/battle/update-statistik` - Update statistik battle
- `GET /api/battle/statistik-global` - Get statistik global
- `GET /api/battle/top-pemain` - Get top pemain

### Pertanyaan
- `GET /api/pertanyaan` - Get semua pertanyaan
- `GET /api/pertanyaan/random` - Get pertanyaan random
- `GET /api/pertanyaan/kategori/:kategori` - Get pertanyaan berdasarkan kategori
- `POST /api/pertanyaan` - Tambah pertanyaan baru
- `PUT /api/pertanyaan/:id` - Update pertanyaan
- `DELETE /api/pertanyaan/:id` - Hapus pertanyaan

## 🔄 Socket.IO Events

### Client ke Server
- `bergabung-tim` - Pemain bergabung dengan tim
- `update-lokasi` - Update lokasi pemain
- `jawab-pertanyaan` - Jawaban pertanyaan battle

### Server ke Client
- `bergabung-berhasil` - Konfirmasi bergabung tim
- `pemain-baru` - Notifikasi pemain baru bergabung
- `battle-dimulai` - Notifikasi battle dimulai
- `battle-selesai` - Hasil battle
- `pemain-keluar` - Notifikasi pemain keluar

## 🚀 Deployment ke Railway

1. **Push ke GitLab**
```bash
git add .
git commit -m "Initial backend setup"
git push origin main
```

2. **Deploy ke Railway**
- Buka [Railway](https://railway.app)
- Connect dengan GitLab repository
- Tambahkan MongoDB addon
- Set environment variables:
  - `MONGODB_URI` (otomatis dari MongoDB addon)
  - `JWT_SECRET` (generate secret key)
  - `FRONTEND_URL` (URL frontend Vercel)

3. **Seed data setelah deploy**
```bash
# Akses Railway console atau gunakan Railway CLI
npm run seed
```

## 🔧 Scripts

```bash
npm start          # Jalankan server production
npm run dev        # Jalankan server development
npm run seed       # Seed data pertanyaan
npm test           # Jalankan tests
```

## 📊 Monitoring

- **Logs**: Cek Railway dashboard untuk logs
- **Database**: Monitor MongoDB performance
- **Socket Connections**: Monitor active connections

## 🔒 Security

- Password di-hash menggunakan bcryptjs
- JWT token untuk autentikasi
- CORS dikonfigurasi untuk frontend
- Input validation di semua endpoint

## 🐛 Troubleshooting

### Error MongoDB Connection
- Pastikan MongoDB running
- Cek MONGODB_URI di .env
- Pastikan network access di Railway

### Error Socket.IO
- Cek CORS configuration
- Pastikan frontend URL benar
- Monitor connection logs

### Error JWT
- Generate JWT_SECRET yang kuat
- Pastikan token tidak expired
- Cek Authorization header

## 📝 License

MIT License - lihat file LICENSE untuk detail.

## 🤝 Contributing

1. Fork repository
2. Buat feature branch
3. Commit changes
4. Push ke branch
5. Buat Pull Request

---

**Dibuat dengan ❤️ untuk games battle showdown yang seru!** 🎮 