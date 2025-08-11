# Setup Google Sheets untuk Sistem Pertanyaan

## 📋 Overview

Sistem ini menggunakan Google Sheets sebagai database untuk menyimpan pertanyaan yang akan digunakan dalam game. Game Master tidak membuat pertanyaan baru, tapi hanya memilih dan memicu pertanyaan yang sudah ada di Google Sheets ke peserta secara real time.

## 🔧 Setup Google Sheets

### 1. Buat Google Sheets Baru
- Buka [Google Sheets](https://sheets.google.com)
- Buat spreadsheet baru
- Copy URL spreadsheet (akan digunakan sebagai `GOOGLE_SHEET_ID`)

### 2. Setup Google Service Account
1. Buka [Google Cloud Console](https://console.cloud.google.com)
2. Buat project baru atau pilih yang sudah ada
3. Enable Google Sheets API
4. Buat Service Account
5. Download JSON credentials
6. Share spreadsheet dengan email service account

### 3. Environment Variables
Tambahkan ke file `.env` di backend:

```env
GOOGLE_SHEET_ID=your_spreadsheet_id_here
GOOGLE_SERVICE_ACCOUNT_EMAIL=your_service_account_email@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

## 📊 Struktur Spreadsheet

### Sheet: Questions
| id | pertanyaan | pilihan_a | pilihan_b | pilihan_c | pilihan_d | jawaban_benar | kategori | tingkat_kesulitan |
|----|------------|-----------|-----------|-----------|-----------|----------------|----------|-------------------|
| q1 | Ibu kota Indonesia adalah? | Jakarta | Bandung | Surabaya | Yogyakarta | a | geografi | mudah |

### Sheet: Players
| socket_id | nama | tim | latitude | longitude | timestamp | status |
|-----------|------|-----|----------|-----------|-----------|---------|

## 🚀 Cara Penggunaan

### 1. Import Pertanyaan Awal
Jalankan script untuk mengisi Google Sheets dengan pertanyaan:

```bash
cd backend
node scripts/import-from-sheets.js
```

### 2. Admin Panel
- Buka `/admin` untuk mengelola pertanyaan
- Tambah, edit, atau hapus pertanyaan
- Semua perubahan langsung tersimpan ke Google Sheets

### 3. Game Master
- Buka `/game-master` untuk memicu pertanyaan
- Pilih pertanyaan dari daftar yang tersedia
- Trigger pertanyaan ke semua peserta secara real time

### 4. Peserta
- Bergabung ke lobby
- Menerima pertanyaan dari Game Master
- Jawab pertanyaan secara real time

## 🔄 API Endpoints

### Frontend API Routes
- `GET /api/pertanyaan` - Ambil semua pertanyaan
- `GET /api/pertanyaan/random` - Ambil pertanyaan random
- `POST /api/pertanyaan/add` - Tambah pertanyaan baru

### Backend API Routes
- `GET /api/pertanyaan/sheets` - Ambil pertanyaan dari Google Sheets
- `POST /api/pertanyaan/sheets` - Tambah pertanyaan ke Google Sheets
- `GET /api/pertanyaan/sheets/random` - Ambil pertanyaan random dari Google Sheets

## 📱 Fitur Utama

### Admin Panel
- ✅ Tambah pertanyaan baru
- ✅ Edit pertanyaan yang ada
- ✅ Hapus pertanyaan
- ✅ Filter berdasarkan kategori dan tingkat kesulitan
- ✅ Search pertanyaan
- ✅ Export ke Google Sheets

### Game Master
- ✅ Lihat daftar pertanyaan yang tersedia
- ✅ Pilih pertanyaan berdasarkan kategori/tingkat
- ✅ Trigger pertanyaan ke semua peserta
- ✅ Monitor jawaban peserta secara real time
- ✅ Kontrol durasi pertanyaan

### Real-time Features
- ✅ WebSocket connection untuk real-time updates
- ✅ Live battle system
- ✅ Instant answer broadcasting
- ✅ Player location tracking

## 🎯 Kategori Pertanyaan

- **umum** - Pertanyaan umum
- **sejarah** - Sejarah Indonesia dan dunia
- **sains** - Ilmu pengetahuan
- **teknologi** - Teknologi dan komputer
- **olahraga** - Olahraga dan permainan
- **hiburan** - Film, musik, dan hiburan
- **geografi** - Geografi dan tempat
- **matematika** - Matematika dan angka
- **sastra** - Sastra dan bahasa
- **seni** - Seni dan budaya
- **ekonomi** - Ekonomi dan bisnis
- **politik** - Politik dan pemerintahan

## 📊 Tingkat Kesulitan

- **mudah** - Pertanyaan mudah (SD)
- **sedang** - Pertanyaan menengah (SMP)
- **sulit** - Pertanyaan sulit (SMA+)

## 🚨 Troubleshooting

### Error: "Gagal terhubung ke Google Sheets"
1. Periksa environment variables
2. Pastikan service account email benar
3. Pastikan spreadsheet sudah di-share dengan service account
4. Periksa Google Sheets API sudah enabled

### Error: "Pertanyaan tidak ditemukan"
1. Jalankan script import untuk mengisi data awal
2. Periksa struktur spreadsheet
3. Pastikan headers sudah benar

### Error: "Rate limit exceeded"
1. Tambah delay antara requests
2. Gunakan batch operations
3. Periksa quota Google Sheets API

## 📈 Monitoring

### Logs
- Backend logs untuk API calls
- Google Sheets API usage
- Error tracking dan debugging

### Metrics
- Jumlah pertanyaan aktif
- Tingkat penggunaan pertanyaan
- Response time dari Google Sheets
- Error rate

## 🔒 Security

- Service account credentials aman
- Tidak ada API key yang terekspos
- Validasi input di semua endpoints
- Rate limiting untuk mencegah abuse

## 📚 Resources

- [Google Sheets API Documentation](https://developers.google.com/sheets/api)
- [Google Cloud Console](https://console.cloud.google.com)
- [Service Account Setup Guide](https://cloud.google.com/iam/docs/service-accounts)
- [Google Sheets Node.js Library](https://www.npmjs.com/package/google-spreadsheet)

## 🤝 Support

Jika ada masalah atau pertanyaan:
1. Periksa logs backend
2. Test koneksi Google Sheets
3. Verifikasi environment variables
4. Check Google Cloud Console untuk quota dan permissions

## 🚂 Deployment ke Railway

### Set Environment Variables di Railway
1. **Buka** [Railway Dashboard](https://railway.app)
2. **Login** dan pilih project backend
3. **Klik** tab "Variables"
4. **Add 3 environment variables**:

#### Variable 1: GOOGLE_SHEET_ID
```
Name: GOOGLE_SHEET_ID
Value: [SPREADSHEET_ID_ANDA]
```

#### Variable 2: GOOGLE_SERVICE_ACCOUNT_EMAIL
```
Name: GOOGLE_SERVICE_ACCOUNT_EMAIL
Value: [SERVICE_ACCOUNT_EMAIL]
```

#### Variable 3: GOOGLE_PRIVATE_KEY
```
Name: GOOGLE_PRIVATE_KEY
Value: -----BEGIN PRIVATE KEY-----
[PRIVATE_KEY_CONTENT]
-----END PRIVATE KEY-----
```

**⚠️ PENTING untuk GOOGLE_PRIVATE_KEY:**
- Copy seluruh private key termasuk header dan footer
- Jangan ubah format `\n` dalam string
- Pastikan tidak ada spasi extra di awal/akhir

## 🧪 Test Setup

Setelah set environment variables:

1. **Railway akan auto-deploy** backend dengan config baru
2. **Test endpoint**:
   ```bash
   curl https://[RAILWAY_URL]/health
   ```
3. **Check logs** di Railway dashboard untuk connection status

## 📊 Seed Initial Data

Setelah backend running:

1. **Railway console**, run:
   ```bash
   npm run seed-sheets
   ```
2. **Check spreadsheet** - akan muncul 2 sheets:
   - `Questions`: Berisi sample pertanyaan
   - `Players`: Berisi data pemain aktif

## ✅ Verification Checklist

- [ ] Google Cloud project created
- [ ] Google Sheets API enabled
- [ ] Service account created
- [ ] JSON key downloaded
- [ ] Spreadsheet shared dengan service account
- [ ] Environment variables set di Railway
- [ ] Backend deployed successfully
- [ ] Spreadsheet memiliki 2 sheets (Questions & Players)
- [ ] Questions sheet berisi sample data
- [ ] Health check endpoint responding

## 🔍 Troubleshooting Lanjutan

### Error: "Unable to parse key"
- Check GOOGLE_PRIVATE_KEY format
- Pastikan include -----BEGIN dan -----END lines
- Pastikan tidak ada extra spaces

### Error: "Insufficient Permission" 
- Pastikan spreadsheet di-share dengan service account email
- Check permission level adalah "Editor"

### Error: "Spreadsheet not found"
- Verify GOOGLE_SHEET_ID benar
- Check spreadsheet visibility (tidak private)

### Error: "API not enabled"
- Enable Google Sheets API di Google Cloud Console
- Tunggu beberapa menit untuk propagation

## 📱 Next Steps

Setelah setup selesai:
1. Test multiplayer di HP dan tablet
2. Check data tersimpan di Google Sheets
3. Monitor players activity di sheets
4. Add more questions sesuai kebutuhan

## 💡 Tips

1. **Backup JSON key** - simpan di tempat aman
2. **Monitor quota** - Google Sheets ada limit API calls
3. **Regular cleanup** - hapus old player data
4. **Add more questions** - edit langsung di spreadsheet
