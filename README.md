# 🎮 Battle Showdown - Game Battle Seru Tanpa Login!

Game battle showdown yang super simple dan fun! Pemain bisa langsung main tanpa ribet login, sementara Game Master bisa kontrol game dari panel khusus. Dibangun dengan Next.js frontend dan Node.js backend untuk pengalaman gaming yang smooth dan real-time! 🚀

## ✨ Fitur Utama

- **🚀 Instant Play** - Masuk langsung tanpa login, tinggal ketik nama dan pilih tim
- **🔴⚪ Team Battle** - Bertarung dalam tim merah vs putih dengan warna yang aesthetic
- **🎯 Real-time Questions** - Game Master kirim pertanyaan real-time ke semua pemain
- **📊 Live Spectator** - Lihat game dari sisi penonton dengan statistik lengkap
- **🎨 Modern UI/UX** - Interface yang clean, modern dan aesthetic dengan warna merah-putih
- **🔌 WebSocket Integration** - Real-time communication antara pemain dan Game Master
- **📱 Responsive Design** - Bisa dimainkan di desktop, tablet, dan mobile
- **🎮 Admin Panel** - Kontrol game dari dashboard admin yang powerful
- **📍 GPS Detection** - Deteksi jarak antar pemain dengan akurasi 1 meter
- **⚔️ Auto Battle** - Pertempuran otomatis ketika pemain lawan bertemu

## 🎯 Cara Main

### Untuk Pemain:
1. **Buka website** - Akses halaman utama
2. **Masukkan nama** - Ketik nama kamu
3. **Pilih tim** - Pilih Tim Merah atau Tim Putih
4. **Masuk ke lobby** - Tunggu pertanyaan dari Game Master
5. **Jawab pertanyaan** - Pilih jawaban yang benar dalam waktu yang ditentukan
6. **Lihat hasil** - Tunggu hasil dan lanjut ke pertanyaan berikutnya

### Untuk Game Master:
1. **Akses panel** - Buka `/game-master`
2. **Buat pertanyaan** - Tambah pertanyaan baru dengan pilihan jawaban
3. **Mulai game** - Kirim pertanyaan ke semua pemain
4. **Monitor progress** - Lihat status game dan pemain online
5. **Lihat spectator** - Bisa akses mode spectator untuk lihat game

### Untuk Spectator:
1. **Akses spectator** - Buka `/spectator` atau dari Game Master
2. **Lihat live game** - Monitor pertanyaan dan jawaban real-time
3. **Statistik tim** - Lihat skor dan performa tim merah vs putih
4. **Daftar pemain** - Monitor siapa saja yang online

### Untuk Admin:
1. **Akses admin panel** - Buka `/admin`
2. **Kelola pemain** - Lihat dan manage daftar pemain
3. **Kelola pertanyaan** - Tambah, edit, hapus pertanyaan
4. **Statistik game** - Lihat analytics dan performance

## 🚀 Cara Jalankan

### Prerequisites
- Node.js 18+ 
- npm atau yarn
- Git
- MongoDB (local atau cloud)

### Installation

#### 1. Clone Repository
```bash
git clone <repository-url>
cd "instant battle games"
```

#### 2. Frontend Setup
```bash
# Install dependencies
npm install

# Setup environment variables
cp env.local.example env.local
# Edit env.local sesuai kebutuhan

# Jalankan development server
npm run dev
```

#### 3. Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Setup environment variables
cp env.example .env
# Edit .env dengan konfigurasi yang sesuai

# Jalankan backend server
npm start

# Atau untuk development dengan nodemon
npm run dev
```

### Development Commands
```bash
# Frontend
npm run dev          # Jalankan di localhost:3000
npm run build        # Build untuk production
npm run start        # Jalankan production build
npm test             # Run tests
npm run lint         # Lint code

# Backend
npm start            # Jalankan production server
npm run dev          # Jalankan dengan nodemon (development)
npm test             # Run backend tests
npm run seed         # Seed data pertanyaan
```

## 🏗️ Struktur Project

```
instant battle games/
├── app/                    # Next.js App Router (Frontend)
│   ├── page.tsx           # Halaman utama - form masuk game
│   ├── layout.tsx         # Root layout dengan providers
│   ├── globals.css        # Global styles dan Tailwind
│   ├── lobby/             # Lobby pemain - tunggu pertanyaan
│   │   └── page.tsx       # Halaman lobby
│   ├── game-master/       # Panel Game Master
│   │   └── page.tsx       # Dashboard Game Master
│   ├── spectator/         # Mode spectator
│   │   └── page.tsx       # Halaman spectator
│   ├── admin/             # Admin panel
│   │   └── page.tsx       # Dashboard admin
│   ├── dashboard/         # User dashboard
│   │   └── page.tsx       # Dashboard pemain
│   ├── event/             # Event management
│   ├── lomba/             # Tournament system
│   └── api/               # API routes
│       └── pertanyaan/     # Question management API
├── components/             # React components
│   ├── ErrorBoundary.tsx  # Error handling component
│   ├── MapComponent.tsx   # Game map component
│   └── SocketManager.tsx  # WebSocket management
├── backend/                # Node.js Backend
│   ├── server.js          # Main server file
│   ├── package.json       # Backend dependencies
│   ├── models/            # Database models
│   │   ├── pemain.js      # Player model
│   │   └── pertanyaan.js  # Question model
│   ├── routes/            # API routes
│   │   ├── auth.js        # Authentication routes
│   │   ├── battle.js      # Game battle routes
│   │   ├── pemain.js      # Player management
│   │   ├── pertanyaan.js  # Question management
│   │   └── pertanyaan-sheets.js # Google Sheets integration
│   ├── services/          # Business logic
│   │   └── googleSheets.js # Google Sheets integration
│   └── scripts/           # Utility scripts
│       ├── seed-pertanyaan.js # Seed questions
│       ├── seed-sheets.js     # Google Sheets setup
│       └── import-from-sheets.js # Import from Google Sheets
├── public/                 # Static assets
│   ├── icon-192x192.png   # PWA icon
│   ├── icon-512x512.png   # PWA icon
│   ├── manifest.json      # PWA manifest
│   ├── robots.txt         # SEO robots
│   └── sitemap.xml        # SEO sitemap
├── lib/                    # Utility libraries
├── types/                  # TypeScript type definitions
├── test/                   # Test files
├── tailwind.config.js      # Tailwind configuration
├── next.config.js          # Next.js configuration
├── tsconfig.json           # TypeScript configuration
└── package.json            # Frontend dependencies
```

## 🔧 Tech Stack

### Frontend
- **Framework**: Next.js 14 dengan App Router
- **Language**: TypeScript
- **UI Library**: React 18
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **State Management**: React Hooks + Context
- **Build Tool**: Next.js built-in bundler

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (dengan Mongoose ODM)
- **Real-time**: Socket.io
- **Authentication**: JWT
- **File Upload**: Multer
- **Validation**: Joi
- **Google Sheets**: googleapis, google-spreadsheet

### Development Tools
- **Package Manager**: npm
- **Version Control**: Git
- **Testing**: Jest
- **Linting**: ESLint
- **Code Formatting**: Prettier
- **Type Checking**: TypeScript

## 🌐 Environment Variables

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
NEXT_PUBLIC_APP_NAME=Battle Showdown
```

### Backend (.env)
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/battle-showdown
JWT_SECRET=your-secret-key
GOOGLE_SHEETS_CREDENTIALS=path/to/credentials.json
GOOGLE_SHEETS_SPREADSHEET_ID=your-spreadsheet-id
FRONTEND_URL=http://localhost:3000
```

## 🎨 Design System

### Warna Utama
- **Merah**: `#dc2626` (Tim Merah)
- **Putih**: `#f8fafc` (Tim Putih)
- **Accent**: `#ef4444` (Button, highlight)
- **Background**: `#ffffff` (Clean white)
- **Text**: `#1f2937` (Dark gray)

### Komponen UI
- **Cards**: Rounded corners (lg), shadows (lg), borders
- **Buttons**: Gradient backgrounds, hover effects, focus states
- **Animations**: Framer Motion untuk smooth transitions
- **Typography**: Inter font family untuk readability
- **Spacing**: Consistent 4px grid system
- **Breakpoints**: Mobile-first responsive design

## 🎯 Game Flow

```
Pemain Masuk → Pilih Tim → Lobby → Tunggu Pertanyaan → Jawab → Hasil → Lanjut
     ↓
Game Master → Buat Pertanyaan → Kirim → Monitor → Spectator Mode
     ↓
Admin Panel → Kelola Game → Analytics → User Management
```

## 🚀 Deployment

### Frontend (Vercel/Netlify)
```bash
# Build project
npm run build

# Deploy ke Vercel
vercel --prod

# Atau deploy ke Netlify
netlify deploy --prod
```

### Backend (Railway/Heroku)
```bash
# Setup Railway
railway login
railway init
railway up

# Atau deploy ke Heroku
heroku create
git push heroku main
```

## 🧪 Testing

### Frontend Tests
```bash
npm test                    # Run all tests
npm run test:watch         # Run tests in watch mode
npm run test:coverage      # Run tests with coverage
```

### Backend Tests
```bash
cd backend
npm test                   # Run all tests
npm run test:watch        # Run tests in watch mode
npm run test:coverage     # Run tests with coverage
```

## 📱 PWA Features

- **Offline Support** - Bisa main offline
- **Installable** - Install sebagai app di device
- **Push Notifications** - Notifikasi real-time
- **Background Sync** - Sync data di background

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/login` - Login user
- `POST /api/auth/register` - Register user
- `POST /api/auth/logout` - Logout user

### Game
- `GET /api/battle/status` - Get game status
- `POST /api/battle/start` - Start new game
- `POST /api/battle/answer` - Submit answer
- `GET /api/battle/leaderboard` - Get leaderboard

### Players
- `GET /api/pemain` - Get all players
- `POST /api/pemain` - Create new player
- `PUT /api/pemain/:id` - Update player
- `DELETE /api/pemain/:id` - Delete player

### Questions
- `GET /api/pertanyaan` - Get all questions
- `POST /api/pertanyaan` - Create new question
- `PUT /api/pertanyaan/:id` - Update question
- `DELETE /api/pertanyaan/:id` - Delete question

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

## 🚧 Roadmap

### Phase 1 (Current)
- [x] Basic game mechanics
- [x] WebSocket integration
- [x] Admin panel
- [x] PWA support
- [x] GPS detection system
- [x] Google Sheets integration

### Phase 2 (Next)
- [ ] Advanced scoring system
- [ ] Tournament mode
- [ ] Custom themes
- [ ] Mobile app

### Phase 3 (Future)
- [ ] AI-powered questions
- [ ] Multi-language support
- [ ] Social features
- [ ] Analytics dashboard

## 🤝 Contributing

1. Fork repository
2. Buat feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push ke branch (`git push origin feature/AmazingFeature`)
5. Buat Pull Request

### Development Guidelines
- Gunakan conventional commits
- Write tests untuk fitur baru
- Follow ESLint rules
- Update documentation

## 🐛 Troubleshooting

### Common Issues
1. **Port already in use**: Ganti port di .env file
2. **MongoDB connection failed**: Check MONGODB_URI
3. **WebSocket not working**: Verify SOCKET_URL
4. **Build failed**: Clear .next folder dan node_modules

### Debug Mode
```bash
# Frontend debug
DEBUG=* npm run dev

# Backend debug
DEBUG=* npm run dev
```

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.

## 🎉 Credits

Dibuat dengan ❤️ untuk game battle yang seru dan simple!

**Special Thanks:**
- Next.js team untuk framework yang amazing
- Tailwind CSS untuk styling yang powerful
- Framer Motion untuk animations yang smooth
- Socket.io untuk real-time communication

---

**Happy Gaming! 🎮✨**

*Jangan lupa kasih ⭐ jika project ini bermanfaat!*
