# SIMAWA - Sistem Informasi Kemahasiswaan

SIMAWA adalah platform manajemen kegiatan kemahasiswaan yang modern, mencakup pengelolaan surat-menyurat, proposal kegiatan, dan laporan pertanggungjawaban (LPJ) dengan alur persetujuan bertingkat (Organisasi -> BEM -> DEMA).

## Fitur Utama

- **Manajemen Organisasi**: CRUD organisasi, anggota, dan pendaftaran anggota baru.
- **Surat Menyurat**:
  - Pembuatan surat otomatis (Undangan & Resmi) dengan PDF generation.
  - Alur persetujuan multi-level (BEM & DEMA).
  - Tanda tangan digital (QR Code/Stamp).
  - Arsip surat digital.
- **Manajemen Aktivitas**: Pengajuan proposal kegiatan dan tracking status persetujuan.
- **LPJ & Laporan**: Pengumpulan dan review Laporan Pertanggungjawaban.
- **Notifikasi**: Real-time notification untuk status pengajuan.
- **Keamanan**:
  - Rate Limiting (Per-IP & User).
  - Role-Based Access Control (RBAC).
  - Validasi File (Magic Bytes).
  - Audit Logging.

## Struktur Project

- `simawa-backend/`: API Server (Go, Gin, GORM).
- `simawa-frontend/`: Web Application (Next.js 15, React, Tailwind).

## Dokumentasi

- [Panduan Deployment & Server Specs](DEPLOYMENT.md)
- [Arsitektur & Diagram Alur](ARCHITECTURE.md)

## Cara Menjalankan (Development)

### Backend

```bash
cd simawa-backend
# Copy env
cp .env.example .env
# Install dependencies
go mod download
# Run with Air (Live Reload)
air
# Atau run biasa
go run cmd/api/main.go
```

### Frontend

```bash
cd simawa-frontend
# Install dependencies
npm install
# Run dev server
npm run dev
```

### Testing

Untuk menjalankan automation tests (E2E):

```bash
cd simawa-frontend
npm run test:e2e
```
