# Google Sheets Database Setup Guide

## 🎯 **Overview**
Panduan lengkap untuk setup Google Sheets sebagai database untuk Battle Showdown Game.

## 📝 **Step 1: Buat Google Spreadsheet**

1. **Buka** [Google Sheets](https://sheets.google.com)
2. **Klik** "Blank" untuk spreadsheet baru
3. **Rename** jadi "Battle Showdown Database"
4. **Copy Spreadsheet ID** dari URL:
   ```
   https://docs.google.com/spreadsheets/d/[COPY_THIS_ID]/edit
   ```
   Contoh ID: `1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms`

## ☁️ **Step 2: Setup Google Cloud Project**

1. **Buka** [Google Cloud Console](https://console.cloud.google.com/)
2. **Sign in** dengan Google account
3. **Create New Project**:
   - Project name: `battle-showdown-game`
   - Organization: (biarkan default)
4. **Klik** "Create"

## 🔌 **Step 3: Enable Google Sheets API**

1. **Di navigation menu**, cari "APIs & Services"
2. **Klik** "Library"
3. **Search** "Google Sheets API"
4. **Klik** pada hasil pertama
5. **Klik** "Enable"
6. **Tunggu** proses selesai

## 👤 **Step 4: Buat Service Account**

1. **Go to** "IAM & Admin" > "Service Accounts"
2. **Klik** "CREATE SERVICE ACCOUNT"
3. **Service Account Details**:
   ```
   Name: battle-showdown-sheets
   ID: battle-showdown-sheets
   Description: Service account for Battle Showdown database
   ```
4. **Klik** "CREATE AND CONTINUE"
5. **Grant access** (optional - skip this step)
6. **Klik** "CONTINUE"
7. **User access** (optional - skip this step)
8. **Klik** "DONE"

## 🔑 **Step 5: Generate JSON Key**

1. **Klik** service account yang baru dibuat
2. **Go to** tab "KEYS"
3. **Klik** "ADD KEY" > "Create new key"
4. **Select** "JSON" key type
5. **Klik** "CREATE"
6. **File JSON otomatis download** - simpan baik-baik!

## 🤝 **Step 6: Share Spreadsheet dengan Service Account**

1. **Buka** spreadsheet "Battle Showdown Database"
2. **Klik** tombol "Share" (pojok kanan atas)
3. **Copy email** dari file JSON:
   ```json
   "client_email": "battle-showdown-sheets@project-name.iam.gserviceaccount.com"
   ```
4. **Paste email** di field "Add people and groups"
5. **Change permission** dari "Viewer" ke "Editor"
6. **Uncheck** "Notify people"
7. **Klik** "Share"

## 🔧 **Step 7: Extract Credentials dari JSON**

Buka file JSON yang di-download, extract 3 values ini:

```json
{
  "client_email": "battle-showdown-sheets@project-name.iam.gserviceaccount.com",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w...\n-----END PRIVATE KEY-----\n",
  "private_key_id": "xxxxx"
}
```

## 🚂 **Step 8: Set Environment Variables di Railway**

1. **Buka** [Railway Dashboard](https://railway.app)
2. **Login** dan pilih project backend
3. **Klik** tab "Variables"
4. **Add 3 environment variables**:

### Variable 1: GOOGLE_SHEET_ID
```
Name: GOOGLE_SHEET_ID
Value: 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms
```
(Ganti dengan ID spreadsheet kamu)

### Variable 2: GOOGLE_SERVICE_ACCOUNT_EMAIL
```
Name: GOOGLE_SERVICE_ACCOUNT_EMAIL
Value: battle-showdown-sheets@project-name.iam.gserviceaccount.com
```
(Ganti dengan email dari JSON)

### Variable 3: GOOGLE_PRIVATE_KEY
```
Name: GOOGLE_PRIVATE_KEY
Value: -----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...
...
-----END PRIVATE KEY-----
```
(Copy entire private key dari JSON, termasuk BEGIN dan END lines)

**⚠️ PENTING untuk GOOGLE_PRIVATE_KEY:**
- Copy seluruh private key termasuk header dan footer
- Jangan ubah format `\n` dalam string
- Pastikan tidak ada spasi extra di awal/akhir

## 🧪 **Step 9: Test Setup**

Setelah set environment variables:

1. **Railway akan auto-deploy** backend dengan config baru
2. **Test endpoint**:
   ```bash
   curl https://battleshowdownback-production.up.railway.app/health
   ```
3. **Check logs** di Railway dashboard untuk connection status

## 📊 **Step 10: Seed Initial Data**

Setelah backend running:

1. **Railway console**, run:
   ```bash
   npm run seed-sheets
   ```
2. **Check spreadsheet** - akan muncul 2 sheets:
   - `Questions`: Berisi sample pertanyaan
   - `Players`: Berisi data pemain aktif

## ✅ **Verification Checklist**

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

## 🔍 **Troubleshooting**

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

## 📱 **Next Steps**

Setelah setup selesai:
1. Test multiplayer di HP dan tablet
2. Check data tersimpan di Google Sheets
3. Monitor players activity di sheets
4. Add more questions sesuai kebutuhan

## 💡 **Tips**

1. **Backup JSON key** - simpan di tempat aman
2. **Monitor quota** - Google Sheets ada limit API calls
3. **Regular cleanup** - hapus old player data
4. **Add more questions** - edit langsung di spreadsheet 