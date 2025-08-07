# Railway Deployment Guide

## 🔧 **Railway Configuration**

### Environment Variables yang Diperlukan:

```bash
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/battle-games
JWT_SECRET=your-secret-key-here
PORT=5000
FRONTEND_URL=https://your-frontend-url.vercel.app
```

### Cara Set Environment Variables di Railway:

1. Buka Railway Dashboard
2. Pilih project backend
3. Klik tab "Variables"
4. Tambahkan variable berikut:
   - `MONGODB_URI`: URL MongoDB Atlas
   - `JWT_SECRET`: Secret key untuk JWT
   - `PORT`: 5000 (default)
   - `FRONTEND_URL`: URL frontend Vercel

### Health Check Endpoints:

- **Root**: `GET /` - Info API
- **Health**: `GET /health` - Status server

### Troubleshooting:

#### Error 502 - Application failed to respond:
1. Cek environment variables sudah ter-set
2. Cek MongoDB connection
3. Cek logs di Railway dashboard

#### Database Connection Error:
1. Pastikan `MONGODB_URI` benar
2. Pastikan MongoDB Atlas whitelist Railway IP
3. Cek network connectivity

#### Port Issues:
1. Railway otomatis set `PORT` environment variable
2. Server akan listen di port yang disediakan Railway

### Deployment Commands:

```bash
# Build (tidak diperlukan untuk Node.js)
npm run build

# Start
npm start

# Health check
curl https://your-app.railway.app/health
```

### Monitoring:

1. **Logs**: Cek di Railway dashboard
2. **Metrics**: CPU, Memory usage
3. **Health**: Otomatis restart jika unhealthy

### Database Setup:

1. Buat MongoDB Atlas cluster
2. Set network access ke 0.0.0.0/0
3. Buat database user
4. Set connection string di Railway

### Seed Data:

```bash
# Jalankan setelah deployment
npm run seed
```

## 🚀 **Deployment Checklist:**

- [ ] Environment variables ter-set
- [ ] MongoDB connection berhasil
- [ ] Health check endpoint berjalan
- [ ] API endpoints berfungsi
- [ ] Socket.IO connection aktif
- [ ] Database seeded dengan data awal

## 📊 **Monitoring Commands:**

```bash
# Test health check
curl https://battleshowdownback-production.up.railway.app/health

# Test API endpoints
curl https://battleshowdownback-production.up.railway.app/api/pertanyaan/random

# Test root endpoint
curl https://battleshowdownback-production.up.railway.app/
``` 