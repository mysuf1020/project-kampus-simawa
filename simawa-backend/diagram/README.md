# SIMAWA - Diagram Dokumentasi

Folder ini berisi diagram-diagram untuk dokumentasi sistem SIMAWA (Sistem Informasi Kemahasiswaan).

## Daftar Diagram

### 1. Use Case Diagram
**File:** `1-use-case-diagram.png`

Menggambarkan interaksi antara aktor (Admin, Org Admin, User, Public) dengan fitur-fitur sistem SIMAWA.

**Aktor:**
- **Admin** - Akses penuh ke semua fitur
- **Org Admin** - Mengelola organisasi, surat, aktivitas, LPJ
- **User** - Akses terbatas ke profil dan view publik
- **Public** - Akses ke halaman publik tanpa login

### 2. Activity Diagram
**File:** `2-activity-diagram.png`

Menggambarkan alur aktivitas pembuatan surat dari awal hingga approval.

**Alur Utama:**
1. Login → Dashboard
2. Pilih Organisasi → Isi Form Surat
3. Upload Logo/TTD → Preview PDF
4. Submit → Admin Review
5. Approve/Reject → Notifikasi

### 3. Class Diagram
**File:** `3-class-diagram.png`

Menggambarkan struktur class/model data dalam sistem.

**Model Utama:**
- `User` - Data pengguna
- `Organization` - Data organisasi
- `Surat` & `SuratTemplate` - Manajemen surat
- `Activity` - Kegiatan organisasi
- `LPJ` - Laporan Pertanggungjawaban
- `Notification` - Sistem notifikasi

### 4. Sequence Diagram
**File:** `4-sequence-diagram.png`

Menggambarkan interaksi antar komponen sistem secara berurutan.

**Flow yang digambarkan:**
- Flow Login (Authentication)
- Flow Buat Surat
- Flow Approval Surat

**Komponen:**
- Frontend (Next.js)
- Backend (Go/Gin)
- Auth Service
- PostgreSQL Database
- MinIO Storage
- Redis Cache

### 5. Entity Relationship Diagram (ERD)
**File:** `5-erd-diagram.png`

Menggambarkan struktur database dan relasi antar tabel.

**Tabel Utama:**
- `users` - Data pengguna
- `organizations` - Data organisasi
- `surat` & `surat_templates` - Manajemen surat
- `activities` - Kegiatan
- `lpj` - Laporan Pertanggungjawaban
- `notifications` - Notifikasi
- `user_roles` & `org_members` - Manajemen role

### 6. Flowchart
**File:** `6-flowchart-diagram.png`

Menggambarkan alur sistem secara keseluruhan.

**Modul:**
- Authentication Flow
- Dashboard Navigation
- Surat Management Flow
- Activity Management Flow
- Organization Management Flow

### 7. Data Flow Diagram (DFD)
**File:** `7-dfd-diagram.png`

Menggambarkan aliran data dalam sistem.

**Level 0:** Gambaran umum sistem dengan external entities dan data stores
**Level 1:** Detail modul Surat dengan proses-proses internal

---

## Teknologi

Diagram dibuat menggunakan **Mermaid.js** dan di-render ke format PNG.

### File Source
Setiap diagram memiliki file source `.mmd` yang dapat diedit menggunakan:
- [Mermaid Live Editor](https://mermaid.live/)
- VS Code dengan extension Mermaid
- Atau tool lain yang mendukung Mermaid syntax

### Regenerate Diagram
Untuk regenerate diagram dari file `.mmd`:

```bash
npx @mermaid-js/mermaid-cli -i <file>.mmd -o <file>.png -b transparent
```

---

## Stack Teknologi SIMAWA

### Frontend
- Next.js 15 (App Router)
- React 19
- TailwindCSS
- TanStack Query
- NextAuth.js
- Radix UI

### Backend
- Go + Gin Framework
- GORM (PostgreSQL)
- Redis (Caching & Rate Limiting)
- MinIO (Object Storage)
- JWT Authentication

### Security
- JWT Access + Refresh Token
- Role-Based Access Control (RBAC)
- Rate Limiting (per IP)
- Security Headers (CSP, HSTS, etc.)
- Input Validation

---

© 2025 SIMAWA - Sistem Informasi Kemahasiswaan
