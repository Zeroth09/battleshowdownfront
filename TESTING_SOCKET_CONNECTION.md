# 🧪 Testing Socket Connection - Battle Showdown

## 📋 Prerequisites

1. **Backend berjalan** di `http://localhost:5000`
2. **Frontend berjalan** di `http://localhost:3000`
3. **Browser modern** yang mendukung WebSocket

## 🚀 Cara Testing

### 1. Jalankan Backend
```bash
cd backend
npm run dev
# atau
node server.js
```

### 2. Jalankan Frontend
```bash
npm run dev
```

### 3. Test Socket Connection
Buka file `test-socket-connection.html` di browser:
- Double click file HTML
- Atau drag & drop ke browser
- Atau buka dengan `file:///path/to/test-socket-connection.html`

## 🎯 Yang Akan Di-test

### ✅ Koneksi Socket
- [ ] Pemain bisa terhubung ke backend
- [ ] Event `connect` diterima
- [ ] Event `disconnect` diterima
- [ ] Reconnection otomatis

### ✅ Lobby Events
- [ ] Event `join-lobby` dikirim
- [ ] Event `lobby-update` diterima
- [ ] Daftar pemain ter-update real-time
- [ ] Pemain lain bisa melihat pemain baru

### ✅ Battle Events
- [ ] Event `battle-start` diterima
- [ ] Event `battle-selesai` diterima
- [ ] Event `global-battle-start` diterima
- [ ] Event `global-battle-end` diterima

## 🔍 Cara Verifikasi

### 1. Buka Multiple Browser
- Buka `test-socket-connection.html` di 2-3 browser berbeda
- Atau buat multiple pemain di browser yang sama

### 2. Monitor Log Events
- Lihat log di setiap browser
- Pastikan event `lobby-update` diterima
- Verifikasi jumlah pemain bertambah

### 3. Test Disconnect/Reconnect
- Klik tombol "Disconnect" pada salah satu pemain
- Lihat apakah pemain lain menerima update
- Reconnect pemain dan lihat apakah muncul lagi

## 🐛 Troubleshooting

### Backend tidak berjalan
```bash
# Cek apakah port 5000 sudah digunakan
netstat -an | findstr :5000

# Kill process yang menggunakan port 5000
taskkill /F /PID <PID>
```

### Socket tidak terhubung
- Pastikan backend berjalan di port 5000
- Cek console browser untuk error
- Pastikan tidak ada firewall blocking

### Event tidak diterima
- Cek apakah event handler terpasang dengan benar
- Verifikasi nama event di backend dan frontend
- Cek log backend untuk event yang dikirim

## 📊 Expected Results

### Setelah Testing Berhasil:
1. **Multiple pemain** bisa terhubung bersamaan
2. **Real-time updates** pemain online
3. **Event broadcasting** ke semua pemain
4. **Automatic cleanup** saat pemain disconnect
5. **Lobby synchronization** antar browser

### Contoh Output Log:
```
[14:30:15] 🚀 Test Socket Connection dimulai
[14:30:15] 🔗 Backend URL: http://localhost:5000
[14:30:16] ✅ Pemain baru dibuat: Player 1 (merah)
[14:30:16] 🔌 Mencoba menghubungkan Player 1...
[14:30:16] ✅ Player 1 terhubung ke server
[14:30:17] ✅ Pemain baru dibuat: Player 2 (putih)
[14:30:17] 🔌 Mencoba menghubungkan Player 2...
[14:30:17] ✅ Player 2 terhubung ke server
[14:30:17] 👥 Player 1 menerima lobby update: 2 pemain
[14:30:17] 👥 Player 2 menerima lobby update: 2 pemain
```

## 🎮 Next Steps

Setelah testing berhasil:
1. **Integrasikan ke frontend** yang sebenarnya
2. **Test dengan Game Master** untuk trigger battle
3. **Verifikasi real-time gameplay** antar pemain
4. **Deploy ke production** dengan confidence tinggi

## 📞 Support

Jika ada masalah:
1. Cek log backend dan frontend
2. Verifikasi environment variables
3. Test dengan browser developer tools
4. Cek network tab untuk WebSocket connection 