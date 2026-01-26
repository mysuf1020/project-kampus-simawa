# 🚀 Panduan Deploy SIMAWA ke Google Cloud Run (Step-by-Step)

Panduan ini akan membantu Anda deploy aplikasi SIMAWA dari NOL sampai JALAN.

---

## 📋 DAFTAR ISI

1. [Buat Akun Google Cloud](#step-1-buat-akun-google-cloud)
2. [Buat Project Baru](#step-2-buat-project-baru)
3. [Install Google Cloud CLI](#step-3-install-google-cloud-cli)
4. [Login dan Setup CLI](#step-4-login-dan-setup-cli)
5. [Buat Database (Cloud SQL)](#step-5-buat-database-cloud-sql)
6. [Deploy Backend](#step-6-deploy-backend)
7. [Deploy Frontend](#step-7-deploy-frontend)
8. [Testing Aplikasi](#step-8-testing-aplikasi)

---

## STEP 1: Buat Akun Google Cloud

### 1.1 Buka Google Cloud Console
Buka browser dan pergi ke: **https://console.cloud.google.com**

### 1.2 Login dengan Google Account
- Klik "Get started for free" atau "Mulai gratis"
- Login dengan akun Google Anda

### 1.3 Aktifkan Free Trial
- Google memberikan **$300 credit gratis** untuk 90 hari
- Isi informasi yang diminta (nama, alamat, dll)
- **PENTING**: Anda perlu memasukkan kartu kredit/debit untuk verifikasi, tapi TIDAK akan dicharge selama masih dalam free trial

### 1.4 Selesai!
Setelah selesai, Anda akan masuk ke Google Cloud Console.

---

## STEP 2: Buat Project Baru

### 2.1 Buka Project Selector
- Di bagian atas halaman, klik dropdown yang bertuliskan "Select a project"
- Klik "NEW PROJECT"

### 2.2 Isi Detail Project
- **Project name**: `simawa-app` (atau nama lain yang Anda inginkan)
- **Project ID**: akan otomatis dibuat (catat ini, contoh: `simawa-app-123456`)
- **Billing account**: pilih akun billing yang sudah dibuat
- Klik "CREATE"

### 2.3 Pilih Project
- Tunggu beberapa detik sampai project dibuat
- Klik notifikasi atau pilih project dari dropdown

---

## STEP 3: Install Google Cloud CLI

### 3.1 Download dan Install (macOS)

Buka Terminal dan jalankan:

```bash
# Install menggunakan Homebrew
brew install google-cloud-sdk
```

**ATAU** download manual dari: https://cloud.google.com/sdk/docs/install

### 3.2 Verifikasi Instalasi

```bash
gcloud --version
```

Harusnya muncul output seperti:
```
Google Cloud SDK 4xx.x.x
...
```

---

## STEP 4: Login dan Setup CLI

### 4.1 Login ke Google Cloud

```bash
gcloud auth login
```

- Browser akan terbuka otomatis
- Pilih akun Google yang sama dengan yang dipakai di Cloud Console
- Klik "Allow"
- Kembali ke Terminal

### 4.2 Set Project

**GANTI `simawa-app-123456` dengan Project ID Anda yang sebenarnya!**

```bash
gcloud config set project simawa-app-123456
```

### 4.3 Set Region Default

```bash
gcloud config set run/region asia-southeast1
```

### 4.4 Enable APIs yang Diperlukan

```bash
# Enable Cloud Run API
gcloud services enable run.googleapis.com

# Enable Cloud Build API
gcloud services enable cloudbuild.googleapis.com

# Enable Container Registry API
gcloud services enable containerregistry.googleapis.com

# Enable Cloud SQL API
gcloud services enable sqladmin.googleapis.com

# Enable Secret Manager (untuk menyimpan secrets)
gcloud services enable secretmanager.googleapis.com
```

Tunggu sampai semua selesai (masing-masing butuh beberapa detik).

---

## STEP 5: Buat Database (Cloud SQL)

### 5.1 Buat Instance PostgreSQL

**GANTI `YOUR_DB_ROOT_PASSWORD` dengan password yang kuat!**

```bash
gcloud sql instances create simawa-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=asia-southeast1 \
  --root-password=YOUR_DB_ROOT_PASSWORD \
  --storage-size=10GB \
  --storage-type=SSD
```

⏳ **Tunggu 5-10 menit** sampai instance selesai dibuat.

### 5.2 Buat Database

```bash
gcloud sql databases create simawa --instance=simawa-db
```

### 5.3 Buat User Database

**GANTI `YOUR_DB_USER_PASSWORD` dengan password yang kuat!**

```bash
gcloud sql users create simawa_user \
  --instance=simawa-db \
  --password=YOUR_DB_USER_PASSWORD
```

### 5.4 Catat Informasi Database

Jalankan ini untuk melihat connection name:

```bash
gcloud sql instances describe simawa-db --format="value(connectionName)"
```

Output akan seperti: `simawa-app-123456:asia-southeast1:simawa-db`

**CATAT informasi berikut:**
```
DB_CONNECTION_NAME: simawa-app-123456:asia-southeast1:simawa-db
DB_HOST: /cloudsql/simawa-app-123456:asia-southeast1:simawa-db
DB_USER: simawa_user
DB_PASSWORD: (password yang Anda buat di step 5.3)
DB_NAME: simawa
DB_PORT: 5432
```

---

## STEP 6: Deploy Backend

### 6.1 Pindah ke Folder Backend

```bash
cd /Users/mysuf/untitled\ folder/simawa/simawa-backend
```

### 6.2 Build dan Push Docker Image

**GANTI `simawa-app-123456` dengan Project ID Anda!**

```bash
gcloud builds submit --tag gcr.io/simawa-app-123456/simawa-backend
```

⏳ Tunggu 3-5 menit sampai build selesai.

### 6.3 Generate JWT Secret

```bash
# Generate random string untuk JWT secret
openssl rand -base64 32
```

**CATAT output-nya**, contoh: `K7xB2mN9pQ3rS5tV8wY1zA4cE6fH0jL2`

### 6.4 Deploy ke Cloud Run

**GANTI nilai-nilai berikut:**
- `simawa-app-123456` → Project ID Anda
- `YOUR_DB_USER_PASSWORD` → Password database dari step 5.3
- `YOUR_JWT_SECRET` → JWT secret dari step 6.3

```bash
gcloud run deploy simawa-backend \
  --image gcr.io/simawa-app-123456/simawa-backend \
  --region asia-southeast1 \
  --platform managed \
  --allow-unauthenticated \
  --add-cloudsql-instances simawa-app-123456:asia-southeast1:simawa-db \
  --set-env-vars "DB_HOST=/cloudsql/simawa-app-123456:asia-southeast1:simawa-db" \
  --set-env-vars "DB_USER=simawa_user" \
  --set-env-vars "DB_PASSWORD=YOUR_DB_USER_PASSWORD" \
  --set-env-vars "DB_NAME=simawa" \
  --set-env-vars "DB_PORT=5432" \
  --set-env-vars "JWT_SECRET=YOUR_JWT_SECRET" \
  --set-env-vars "GIN_MODE=release" \
  --set-env-vars "PORT=8080" \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 3
```

### 6.5 Catat URL Backend

Setelah deploy selesai, akan muncul output seperti:
```
Service [simawa-backend] revision [simawa-backend-00001-xxx] has been deployed and is serving 100 percent of traffic.
Service URL: https://simawa-backend-xxxxxxxxxx-as.a.run.app
```

**CATAT URL ini!** Contoh: `https://simawa-backend-abc123xyz-as.a.run.app`

### 6.6 Test Backend

```bash
curl https://simawa-backend-xxxxxxxxxx-as.a.run.app/health
```

Harusnya muncul response: `{"status":"ok"}` atau sejenisnya.

---

## STEP 7: Deploy Frontend

### 7.1 Pindah ke Folder Frontend

```bash
cd /Users/mysuf/untitled\ folder/simawa/simawa-frontend
```

### 7.2 Generate NextAuth Secret

```bash
openssl rand -base64 32
```

**CATAT output-nya**, contoh: `M8nP3qR6sT9uW2xY5zA1bC4dE7fG0hI3`

### 7.3 Build Docker Image dengan Environment Variables

**GANTI nilai-nilai berikut:**
- `simawa-app-123456` → Project ID Anda
- `https://simawa-backend-xxxxxxxxxx-as.a.run.app` → URL backend dari step 6.5

```bash
gcloud builds submit \
  --tag gcr.io/simawa-app-123456/simawa-frontend \
  --timeout=20m
```

⏳ Tunggu 5-10 menit sampai build selesai.

### 7.4 Deploy ke Cloud Run

**GANTI nilai-nilai berikut:**
- `simawa-app-123456` → Project ID Anda
- `https://simawa-backend-xxx-as.a.run.app` → URL backend dari step 6.5
- `YOUR_NEXTAUTH_SECRET` → NextAuth secret dari step 7.2

```bash
gcloud run deploy simawa-frontend \
  --image gcr.io/simawa-app-123456/simawa-frontend \
  --region asia-southeast1 \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars "NEXT_PUBLIC_API_URL=https://simawa-backend-xxx-as.a.run.app" \
  --set-env-vars "NEXTAUTH_SECRET=YOUR_NEXTAUTH_SECRET" \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 3
```

### 7.5 Update NEXTAUTH_URL

Setelah deploy, catat URL frontend yang muncul, contoh:
`https://simawa-frontend-abc123xyz-as.a.run.app`

Update environment variable:

```bash
gcloud run services update simawa-frontend \
  --region asia-southeast1 \
  --set-env-vars "NEXTAUTH_URL=https://simawa-frontend-abc123xyz-as.a.run.app" \
  --set-env-vars "NEXT_PUBLIC_API_URL=https://simawa-backend-xxx-as.a.run.app" \
  --set-env-vars "NEXTAUTH_SECRET=YOUR_NEXTAUTH_SECRET"
```

---

## STEP 8: Testing Aplikasi

### 8.1 Buka Frontend

Buka browser dan pergi ke URL frontend:
```
https://simawa-frontend-xxxxxxxxxx-as.a.run.app
```

### 8.2 Test Fitur

1. **Halaman Login** - Pastikan halaman login muncul
2. **Register** - Coba daftar akun baru
3. **Login** - Coba login dengan akun yang didaftarkan

### 8.3 Jika Ada Error

Cek logs:

```bash
# Cek logs backend
gcloud run services logs read simawa-backend --region asia-southeast1 --limit 50

# Cek logs frontend
gcloud run services logs read simawa-frontend --region asia-southeast1 --limit 50
```

---

## 🎉 SELESAI!

Aplikasi SIMAWA Anda sekarang sudah berjalan di Google Cloud Run!

**URL Anda:**
- Frontend: `https://simawa-frontend-xxx-as.a.run.app`
- Backend API: `https://simawa-backend-xxx-as.a.run.app`

---

## 📝 Catatan Penting

### Biaya
- **Cloud Run**: Gratis untuk 2 juta request/bulan pertama
- **Cloud SQL**: ~$10-15/bulan untuk instance terkecil
- **Total estimasi**: ~$15-30/bulan untuk low traffic

### Mematikan Sementara (Hemat Biaya)

Jika tidak dipakai, Anda bisa stop Cloud SQL:

```bash
# Stop database (HATI-HATI: aplikasi tidak akan bisa diakses)
gcloud sql instances patch simawa-db --activation-policy=NEVER

# Start lagi
gcloud sql instances patch simawa-db --activation-policy=ALWAYS
```

### Hapus Semua (Jika Tidak Dipakai Lagi)

```bash
# Hapus Cloud Run services
gcloud run services delete simawa-frontend --region asia-southeast1
gcloud run services delete simawa-backend --region asia-southeast1

# Hapus Cloud SQL (HATI-HATI: data akan hilang!)
gcloud sql instances delete simawa-db

# Hapus container images
gcloud container images delete gcr.io/simawa-app-123456/simawa-frontend --force-delete-tags
gcloud container images delete gcr.io/simawa-app-123456/simawa-backend --force-delete-tags
```

---

## ❓ Troubleshooting

### Error: "Permission denied"
```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
```

### Error: "Cloud SQL connection failed"
- Pastikan Cloud SQL instance sudah running
- Pastikan connection name benar
- Cek password database

### Error: "Container failed to start"
```bash
# Cek logs untuk detail error
gcloud run services logs read SERVICE_NAME --region asia-southeast1
```

### Frontend tidak bisa connect ke backend
- Pastikan URL backend di `NEXT_PUBLIC_API_URL` benar
- Pastikan backend sudah running dan bisa diakses

---

## 📞 Butuh Bantuan?

Jika ada langkah yang tidak jelas atau error, copy paste error message-nya dan tanyakan!
