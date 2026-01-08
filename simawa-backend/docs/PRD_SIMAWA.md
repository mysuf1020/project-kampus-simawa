# Product Requirement Document (PRD) – SIMAWA

## 1. Ringkasan Produk

SIMAWA adalah backend service (Go) untuk mengelola organisasi kemahasiswaan: otentikasi, organisasi & anggota, kegiatan, LPJ, notifikasi, dan publikasi kegiatan.

## 2. Sasaran Bisnis

- Mengurangi proses manual kertas untuk proposal & LPJ.  
- Mempercepat siklus persetujuan BEM/DEMA.  
- Meningkatkan transparansi kegiatan & pelaporan.  
- Mempermudah publik melihat aktivitas organisasi.
- Memungkinkan pembuatan surat internal (PDF) berbasis template/payload.

## 3. User Journey (End-to-End)

### 3.1 Admin Organisasi – Proposal & LPJ
1. Login → mendapat access token & refresh token (sesi tunggal).  
2. Membuat proposal kegiatan (draft).  
3. Mengunggah file proposal (PDF).  
4. Mengajukan proposal → status Pending.  
5. Menerima notifikasi ketika disetujui/ditolak.  
6. Setelah kegiatan selesai, mengisi & mengunggah LPJ (PDF).  
7. Menunggu persetujuan LPJ; menerima notifikasi hasil.

### 3.2 BEM/DEMA – Approval & Pengawasan
1. Login sebagai BEM/DEMA ADMIN.  
2. Membuka daftar proposal/LPJ Pending.  
3. Meninjau detail & file PDF.  
4. Menyetujui/menolak dengan catatan.  
5. Melihat statistik di dasbor (pending, total kegiatan, LPJ, org aktif).  
6. Memoderasi cover galeri via endpoint cover approval.

### 3.3 Publik – Konsumsi Informasi
1. Mengakses direktori organisasi.  
2. Melihat kalender kegiatan publik & galeri.  
3. Menggunakan RSS/ICS untuk subscribe ke kalender.

## 4. Lingkup Teknis

### 4.1 Backend
- Bahasa: Go 1.24+.  
- Framework: Gin.  
- DB: PostgreSQL (GORM).  
- Storage file: Minio (S3-compatible).  
- Cache/rate-limit: Redis (opsional).  
- Auth: JWT (HS256) + refresh token.  
- Migrasi: GORM AutoMigrate lewat `--migrate`.

### 4.2 Endpoint High-Level

- `/auth/login`, `/auth/refresh`, `/auth/logout`.  
- `/orgs` (publik), `/v1/orgs/:id` (update profil).  
- `/v1/orgs/:org_id/members` (CRUD anggota).  
- `/v1/activities` (CRUD & submit), `/v1/activities/upload`, `/v1/activities/:id/approve`, `/v1/activities/:id/revision`, `/v1/activities/:id/cover`.  
- `/v1/activities/pending-cover` (daftar cover yang menunggu moderasi BEM/DEMA).  
- `/v1/lpj/submit`, `/v1/lpj/upload`, `/v1/lpj/activity/:activity_id/approve`, `/v1/lpj/activity/:activity_id/revision`, `/v1/lpj/org/:org_id`.  
- `/v1/surat` (buat/preview surat PDF, inbox/outbox per org, approval/reject surat dari payload/template).  
- `/v1/notifications`, `/v1/notifications/:id/read`, `/v1/notifications/mention`.  
- `/public/activities`, `/public/activities.rss`, `/public/activities.ics`.  
- `/health`, `/v1/dashboard/summary`.

## 5. Data & Model

- User: id, username, email, password_hash, profil personal.  
- Role: id, code (ADMIN, ORG_ADMIN, BEM_ADMIN, DEMA_ADMIN, USER).  
- UserRole: user_id, role_code, org_id.  
- Organization: profil & metadata.  
- OrgMember: keanggotaan per organisasi.  
- Activity: data kegiatan + status + cover.  
- ActivityHistory: jejak perubahan kegiatan.  
- LPJ: data LPJ + status.  
- LPJHistory: jejak perubahan LPJ.  
- Surat: org_id, target_org_id/role, status (Draft/Pending/Approved/Rejected), metadata & file_key surat (PDF) beserta template/payload; tersimpan di Minio.  
- RefreshToken: token untuk refresh JWT.  
- Notification: notifikasi in-app.  
- AuditLog: aksi sensitif (login, submit/approve, perubahan org/member).

## 6. Aturan Bisnis Kunci

- Satu refresh token aktif per user (sesi tunggal).  
- Hanya ADMIN/ORG_ADMIN yang boleh membuat/mengubah kegiatan & LPJ di organisasinya.  
- Hanya BEM/DEMA yang boleh menyetujui/menolak proposal & LPJ.  
- Cover untuk galeri harus disetujui BEM/DEMA (pending list moderasi).  
- Upload file hanya PDF; cek ukuran dan MIME.
- Surat: hanya role non-public (ADMIN/ORG_ADMIN/BEM/DEMA) yang dapat membuat/approve; akses inbox/outbox dibatasi ke org/role tujuan.

## 7. Non-Funksional (Teknis)

- Waktu respons < 800ms rata-rata pada beban normal.  
- Rate-limit global & per endpoint (auth/upload).  
- CSP/HSTS/COOP/COEP headers.  
- Healthcheck DB/Redis/Minio.  
- Logging & audit untuk aksi penting.
