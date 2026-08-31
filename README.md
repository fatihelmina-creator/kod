# Bulut Tabanlı QR Evrak Sistemi v2.0

Şifreli, güvenli bulut depolaması ile QR kod tabanlı dosya paylaşım sistemi.

## 🚀 Özellikler

- ✅ **AES-256 Şifreleme** - Tüm dosyalar sunucuda şifreli saklanır
- ✅ **Kullanıcı Kimlik Doğrulaması** - JWT token tabanlı güvenli giriş
- ✅ **Erişim Kontrol** - Özel, Bağlantı ile, veya Herkese Açık seçenekleri
- ✅ **İndirme Limiti** - Her dosya için indirme sayısı sınırı
- ✅ **Otomatik Süre Bitişi** - Dosyaların otomatik silinmesi
- ✅ **QR Kod Üretimi** - Anında QR kod oluşturma
- ✅ **İndirme Geçmişi** - Kim, ne zaman, nereden indir? Takip edin
- ✅ **Şifre Koruması** - Opsiyonel şifre ile dosya koruması
- ✅ **Responsive Tasarım** - Mobil, tablet, masaüstü uyumlu

## 📋 Sistem Gereksinimleri

- Node.js 14+
- MongoDB 4.4+
- npm veya yarn

## 🛠️ Kurulum

### 1. Repository'yi Clone Edin

```bash
git clone https://github.com/fatihelmina-creator/kod.git
cd kod
```

### 2. Branch'ı Seçin

```bash
git checkout feature/enhanced-improvements
```

### 3. Bağımlılıkları Yükleyin

```bash
npm install
```

### 4. Ortam Değişkenlerini Ayarlayın

```bash
# .env.example dosyasını kopyalayın
cp .env.example .env
```

`.env` dosyasını açıp aşağıdaki değişkenleri güncelleyin:

```env
# Server
PORT=3000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/bulut-qr-db

# JWT (Güvenli key oluşturun)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d

# Şifreleme Anahtarı (32 karakter hex)
ENCRYPTION_KEY=your-32-character-hex-encryption-key-here

# CORS
CORS_ORIGIN=http://localhost:3000

# Dosya Ayarları
MAX_FILE_SIZE=52428800
MAX_DOWNLOADS_PER_FILE=10
FILE_EXPIRATION_DAYS=30
```

**Güvenli Anahtarlar Oluşturun:**

```bash
# JWT Secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Encryption Key (32 karakter)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 5. MongoDB'yi Başlatın

**Option A: Docker ile**
```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

**Option B: Local MongoDB**
```bash
# macOS (Homebrew)
brew services start mongodb-community

# Windows
# MongoDB Community Edition'ı yükleyip Services'ten başlatın

# Linux
sudo systemctl start mongod
```

### 6. Sunucuyu Başlatın

**Development Modu:**
```bash
npm run dev
```

**Production Modu:**
```bash
npm start
```

Sunucu **http://localhost:3000** adresinde çalışacak.

## 📚 Kullanım

### Uygulamaya Erişim

```
http://localhost:3000
```

### Kullanıcı Adımları

1. **Kayıt Olun**: Sağ üstteki "Giriş Yap" → "Kayıt Ol"
2. **Dosya Yükleyin**: 
   - Başlık ve açıklama girin
   - Dosya seçin (PDF, Görsel - Max 50MB)
   - Erişim seviyesi seçin
   - "Şifreli Yükle & QR Üret" tıklayın
3. **Dosyayı Paylaşın**:
   - QR kodu tarayıcı ile tarayın
   - veya linki kopyalayın
   - veya şifre ile koruyun

## 🔐 Güvenlik Özellikleri

### Şifreleme
- **Algoritma**: AES-256-CBC
- **Uygulama**: Sunucu tarafında
- **IV**: Her dosya için unique initialization vector

### Kimlik Doğrulama
- **Yöntemi**: JWT (JSON Web Token)
- **Şifre Hashleme**: bcryptjs (10 salt round)
- **Token Süresi**: 7 gün (yapılandırılabilir)

### Erişim Kontrol
- **Özel**: Sadece dosya sahibi erişebilir
- **Bağlantı ile**: QR/Link ile herkes erişebilir
- **Herkese Açık**: Email listesi (opsiyonel) ile kontrol

### Rate Limiting
- Login denemesi: 5 girişim/15 dakika

## 📊 API Endpoints

### Kimlik Doğrulama
```
POST /api/auth/register     - Kayıt ol
POST /api/auth/login        - Giriş yap
POST /api/auth/verify       - Token doğrula
GET  /api/auth/me           - Mevcut kullanıcı
```

### Dosya Yönetimi
```
POST   /api/documents/upload           - Dosya yükle
GET    /api/documents/my-documents     - Kendi dosyaları listele
GET    /api/documents/:docId           - Dosya bilgisini al
GET    /api/documents/:docId/download  - Dosya indir
DELETE /api/documents/:docId           - Dosya sil
PATCH  /api/documents/:docId           - Dosya ayarlarını güncelle
GET    /api/documents/:docId/history   - İndirme geçmişi
```

## 📁 Proje Yapısı

```
kod/
├── public/
│   └── index.html           # Frontend (Tailwind CSS)
├── models/
│   ├── User.js              # Kullanıcı modeli
│   └── Document.js          # Dosya modeli
├── routes/
│   ├── auth.js              # Kimlik doğrulama rotaları
│   └── documents.js         # Dosya rotaları
├── middleware/
│   ├── auth.js              # JWT middleware
│   └── errorHandler.js      # Error handling
├── utils/
│   └── encryption.js        # AES-256 şifreleme
├── server.js                # Express sunucusu
├── package.json             # Bağımlılıklar
├── .env.example             # Örnek ortam değişkenleri
└── .gitignore               # Git ignore kuralları
```

## 🔧 Konfigürasyon

### Dosya Yükleme Limitleri

`.env` dosyasında değiştirin:

```env
MAX_FILE_SIZE=52428800           # 50MB
MAX_DOWNLOADS_PER_FILE=10        # 10 indirme
FILE_EXPIRATION_DAYS=30          # 30 gün
```

### Veritabanı

MongoDB URI'yi `.env` de değiştirin:

```env
MONGODB_URI=mongodb://localhost:27017/bulut-qr-db
```

## 🚀 Production Deployment

### Heroku, Railway, Render, Vercel vb. için

1. **Environment Variables Ayarlayın:**
   - `MONGODB_URI` - Cloud MongoDB URI (MongoDB Atlas)
   - `JWT_SECRET` - Güvenli key
   - `ENCRYPTION_KEY` - Güvenli key
   - `CORS_ORIGIN` - Production domain

2. **MongoDB Atlas Kullanın:**
   ```
   mongodb+srv://username:password@cluster.mongodb.net/bulut-qr-db
   ```

3. **Procfile Oluşturun** (Platform tarafından otomatik okunur):
   ```
   web: npm start
   ```

## 🐛 Sorun Giderme

### "Cannot find module 'xyz'"
```bash
npm install
```

### "MongoDB connection failed"
- MongoDB'nin çalışıp çalışmadığını kontrol edin
- `MONGODB_URI`'yi kontrol edin

### "JWT token hatası"
- Tarayıcı devtools → Application → Cookies → Token kontrolü
- Yeniden giriş yapın

### "Dosya yükleme başarısız"
- Dosya boyutu kontrolü (50MB limit)
- İnternet bağlantısı kontrolü

## 📝 Lisans

MIT License

## 👨‍💻 Geliştirici

Fatih Elmina

---

**Sorularınız mı var?** GitHub Issues'te açın veya iletişime geçin.
