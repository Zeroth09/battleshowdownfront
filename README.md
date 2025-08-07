# 🎮 Battle Showdown Games

Games battle showdown dengan sistem deteksi pemain real-time yang seru dan menantang! Bergabung dengan tim merah atau putih, jelajahi area permainan, dan bertempur melawan lawan dalam pertanyaan seru.

## 🚀 Fitur Utama

### 🎯 Sistem Deteksi Pemain
- **GPS Akurat**: Deteksi jarak antar pemain dengan akurasi 1 meter
- **Real-time Tracking**: Update lokasi secara real-time setiap 5 detik
- **Area Deteksi**: Visualisasi area deteksi di peta interaktif

### ⚔️ Battle Showdown
- **Pertempuran Otomatis**: Battle dimulai otomatis ketika pemain lawan bertemu
- **Pertanyaan Seru**: Ribuan pertanyaan dari berbagai kategori
- **Sistem Skor**: Raih skor tinggi dan naik ke leaderboard
- **Instruksi Dinamis**: "Lanjutkan perjalanan" jika menang, "Kembali ke awal" jika kalah

### 🏆 Tim & Kompetisi
- **Tim Merah vs Putih**: Bergabung dengan tim favorit
- **Statistik Tim**: Monitor performa tim secara real-time
- **Leaderboard**: Peringkat pemain berdasarkan skor

### 🎨 UI/UX Modern
- **Design Aesthetic**: Interface modern dan clean
- **Responsive**: Optimized untuk desktop dan mobile
- **Animations**: Smooth animations dengan Framer Motion
- **Real-time Updates**: Socket.IO untuk komunikasi real-time

## 🛠️ Teknologi yang Digunakan

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Socket.IO** - Real-time communication
- **MongoDB** - Database
- **Mongoose** - ODM untuk MongoDB
- **JWT** - Autentikasi
- **bcryptjs** - Password hashing

### Frontend
- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **Socket.IO Client** - Real-time communication
- **Leaflet** - Interactive maps
- **Lucide React** - Icons

## 📋 Prerequisites

- Node.js (v18 atau lebih baru)
- MongoDB (local atau cloud)
- npm atau yarn
- Git

## 🔧 Instalasi & Setup

### 1. Clone Repository
```bash
git clone <repository-url>
cd instant-battle-games
```

### 2. Setup Backend
```bash
cd backend

# Install dependencies
npm install

# Setup environment variables
cp env.example .env
```

Edit file `.env`:
```env
MONGODB_URI=mongodb://localhost:27017/battle-games
JWT_SECRET=rahasia-jwt-super-secret-key
PORT=5000
FRONTEND_URL=http://localhost:3000
```

### 3. Setup Frontend
```bash
cd ..

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local
```

Edit file `.env.local`:
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
```

### 4. Seed Database
```bash
cd backend
npm run seed
```

### 5. Jalankan Development Server

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

Akses aplikasi di `http://localhost:3000`

## 🚀 Deployment

### Backend ke Railway

1. **Push ke GitLab**
```bash
git add .
git commit -m "Initial setup"
git push origin main
```

2. **Deploy ke Railway**
- Buka [Railway](https://railway.app)
- Connect dengan GitLab repository
- Set root directory ke `backend`
- Tambahkan MongoDB addon
- Set environment variables:
  - `MONGODB_URI` (otomatis dari MongoDB addon)
  - `JWT_SECRET` (generate secret key)
  - `FRONTEND_URL` (URL frontend Vercel)

3. **Seed Database**
```bash
# Akses Railway console
npm run seed
```

### Frontend ke Vercel

1. **Setup Vercel**
- Buka [Vercel](https://vercel.com)
- Import project dari GitLab
- Set root directory ke root project
- Set build command: `npm run build`
- Set output directory: `.next`

2. **Environment Variables**
- `NEXT_PUBLIC_BACKEND_URL`: URL backend Railway

3. **Deploy**
- Vercel akan otomatis deploy setiap push ke main branch

## 🎮 Cara Bermain

### 1. Registrasi & Login
- Daftar akun baru atau login dengan akun yang ada
- Pilih tim merah atau putih
- Lengkapi profil pemain

### 2. Jelajahi Area
- Buka dashboard untuk melihat peta interaktif
- Lokasi pemain ditampilkan dengan marker berwarna
- Area deteksi ditampilkan dengan lingkaran merah

### 3. Cari Lawan
- Bergerak di area permainan
- Cari pemain dari tim lawan
- Sistem akan mendeteksi ketika jarak ≤ 1 meter

### 4. Bertempur
- Battle otomatis dimulai ketika bertemu lawan
- Jawab pertanyaan dengan cepat dan akurat
- Pemain pertama yang jawab benar menang
- Ikuti instruksi setelah battle selesai

### 5. Raih Skor
- Menang: +10 skor, lanjutkan perjalanan
- Kalah: -5 skor, kembali ke awal
- Monitor statistik di dashboard

## 📊 API Endpoints

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
- `GET /api/pemain/leaderboard` - Get leaderboard

### Battle
- `GET /api/battle/riwayat` - Get riwayat battle pemain
- `POST /api/battle/update-statistik` - Update statistik battle
- `GET /api/battle/statistik-global` - Get statistik global
- `GET /api/battle/top-pemain` - Get top pemain

### Pertanyaan
- `GET /api/pertanyaan/random` - Get pertanyaan random
- `GET /api/pertanyaan/kategori/:kategori` - Get pertanyaan berdasarkan kategori

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

## 🔧 Scripts

### Backend
```bash
npm start          # Jalankan server production
npm run dev        # Jalankan server development
npm run seed       # Seed data pertanyaan
npm test           # Jalankan tests
```

### Frontend
```bash
npm run dev        # Jalankan development server
npm run build      # Build untuk production
npm run start      # Jalankan production server
npm run lint       # Lint code
```

## 🔒 Security

- Password di-hash menggunakan bcryptjs
- JWT token untuk autentikasi
- CORS dikonfigurasi untuk frontend
- Input validation di semua endpoint
- HTTPS di production

## 🐛 Troubleshooting

### Error MongoDB Connection
- Pastikan MongoDB running
- Cek MONGODB_URI di .env
- Pastikan network access di Railway

### Error Socket.IO
- Cek CORS configuration
- Pastikan frontend URL benar
- Monitor connection logs

### Error Geolocation
- Pastikan browser mengizinkan lokasi
- Cek HTTPS di production
- Fallback ke default location

### Error Build Frontend
- Pastikan semua dependencies terinstall
- Cek TypeScript errors
- Clear cache: `rm -rf .next`

## 📝 Contributing

1. Fork repository
2. Buat feature branch: `git checkout -b feature/nama-fiturnya`
3. Commit changes: `git commit -m 'Add nama fitur'`
4. Push ke branch: `git push origin feature/nama-fiturnya`
5. Buat Pull Request

## 📄 License

MIT License - lihat file [LICENSE](LICENSE) untuk detail.

## 🤝 Support

Jika ada pertanyaan atau masalah, silakan buat issue di repository ini.

---

**Dibuat dengan ❤️ untuk gamers Indonesia!** 🎮

**Happy Gaming! 🚀** 