# Spesifikasi Hosting & Deployment SIMAWA

## 1. Arsitektur Aplikasi
Aplikasi terdiri dari 5 komponen utama:
1.  **Backend API**: Golang (Gin Framework).
2.  **Frontend**: Next.js (Node.js).
3.  **Database**: PostgreSQL.
4.  **Cache**: Redis.
5.  **Storage**: MinIO (Object Storage) - *Bisa diganti dengan AWS S3/Cloud Storage*.

## 2. Estimasi Kebutuhan Sumber Daya (Resource)

### A. Minimum (Single VPS - All in One)
Cocok untuk staging, demo, atau penggunaan skala kecil (< 100 concurrent users).

*   **CPU**: 2 vCPU
*   **RAM**: 4 GB (Disarankan 4GB karena menjalankan Postgres + MinIO + Node.js sekaligus cukup berat di RAM)
*   **Storage**: 40 GB SSD (Tergantung seberapa banyak upload file/proposal)
*   **OS**: Linux (Ubuntu 22.04 LTS / Debian 11)

**Alokasi RAM (Estimasi):**
*   PostgreSQL: ~512MB - 1GB
*   MinIO: ~512MB
*   Next.js Frontend: ~512MB - 1GB
*   Go Backend: ~100MB - 300MB
*   Redis: ~128MB
*   System Overhead: ~512MB

### B. Rekomendasi Production (Skala Kampus)
Untuk penggunaan produksi yang stabil, disarankan memisahkan Database dan Storage.

1.  **Application Server (VPS/VM)**
    *   Menjalankan: Backend (Go), Frontend (Next.js), Redis.
    *   **CPU**: 2 vCPU
    *   **RAM**: 4 GB
    *   **Disk**: 20 GB SSD (Hanya untuk OS & App)

2.  **Database (Managed Service / Dedicated VPS)**
    *   Menjalankan: PostgreSQL.
    *   **Spec**: 1 vCPU, 2 GB RAM.
    *   *Saran: Gunakan Managed Database (AWS RDS, DigitalOcean Managed DB) untuk backup otomatis.*

3.  **Object Storage (S3 Compatible)**
    *   **Rekomendasi**: Gunakan layanan Cloud Storage (AWS S3, DigitalOcean Spaces, Cloudflare R2) daripada hosting MinIO sendiri untuk hemat resource dan storage tak terbatas.
    *   *Jika Self-hosted MinIO*: Tambahkan resource ke App Server atau VPS terpisah.

## 3. Persiapan Deployment

### Backend (Go)
*   Perlu dicompile menjadi binary linux.
*   Menggunakan `systemd` atau `Docker` untuk menjalankannya.

### Frontend (Next.js)
*   Sudah terkonfigurasi `output: 'standalone'` (siap untuk Docker/Deploy ringan).
*   Membutuhkan Node.js runtime (v18/v20) atau Docker.

### Environment Variables
Pastikan mengatur variabel berikut di server production:
*   `APP_ENV`: production
*   `DB_HOST`, `DB_USER`, `DB_PASS`: Koneksi database production.
*   `MINIO_ENDPOINT`: URL storage public (HTTPS).
*   `JWT_SECRET`: Ganti dengan string acak yang panjang dan aman.

## 4. Opsi Platform Hosting
*   **VPS Murah**: Contabo, IDCloudHost, Biznet Gio (Pilih paket 4GB RAM).
*   **Cloud Provider**: DigitalOcean / AWS (Gunakan Droplet/EC2 t3.medium).
*   **PaaS (Mudah)**:
    *   Frontend: Vercel (Gratis/Pro).
    *   Backend: Railway / Render (Bayar sesuai resource).
    *   DB: Railway / Neon / Supabase.
