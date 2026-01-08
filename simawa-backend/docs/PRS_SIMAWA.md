# Product Requirement Specification (PRS) – SIMAWA

## 1. Pendahuluan

### 1.1 Tujuan
SIMAWA (Sistem Informasi Pengelolaan Organisasi Kemahasiswaan) bertujuan mendigitalisasi proses administrasi HMJ/UKM di Universitas Raharja: pengajuan kegiatan, persetujuan BEM/DEMA, pelaporan LPJ, pengelolaan organisasi dan anggota, serta publikasi kegiatan ke civitas akademika.

### 1.2 Lingkup
- Manajemen organisasi dan anggota.
- Manajemen kegiatan (proposal → approval → pelaksanaan → selesai).
- Manajemen LPJ (unggah laporan & bukti).
- Dasbor internal untuk admin organisasi.
- Dasbor pengawasan BEM/DEMA.
- Dasbor publik (etalase kegiatan).
- Autentikasi & otorisasi berbasis role.

## 2. Persona Utama

- **Admin Organisasi (Amelia)**  
  - Mengelola profil organisasi & anggota.  
  - Mengajukan proposal & LPJ.  
  - Memonitor status approval dan pengingat.

- **BEM/DEMA (Yusuf)**  
  - Menyetujui/menolak proposal dan LPJ.  
  - Melihat ringkasan performa seluruh organisasi.  
  - Melakukan moderasi konten publik (cover galeri).

- **Publik (Mahasiswa/Dosen)**  
  - Melihat profil organisasi.  
  - Melihat kalender & galeri kegiatan publik.

## 3. Fitur Utama (High-Level)

1. **Autentikasi & RBAC**
   - Login dengan email/username + password.  
   - Role: ADMIN, ORG_ADMIN, BEM_ADMIN, DEMA_ADMIN, USER.  
   - Sesi tunggal per user (login baru menonaktifkan sesi lama).  
   - Lockout 15 menit setelah 5 kali gagal login.

2. **Manajemen Organisasi & Anggota**
   - CRUD profil organisasi (deskripsi, kontak, logo, link).  
   - Seed awal daftar organisasi (Himtif, Komasi, dll., BEM, DEMA).  
   - CRUD anggota per organisasi (Tambah/Update/Hapus).  

3. **Manajemen Kegiatan (End-to-End)**
   - Pembuatan dan pengajuan proposal.  
   - Upload proposal (PDF) ke Minio.  
   - Status: Draft, Pending, Approved, Rejected, Completed.  
   - Approval BEM/DEMA dengan catatan.  
   - Revisi dengan history timeline.  
   - Moderasi cover (pending list) oleh BEM/DEMA.  
   - Kalender & galeri publik untuk kegiatan berstatus Approved & Public.

4. **Manajemen Surat**
   - Generate surat berbasis payload/template menjadi PDF.  
   - Status: Draft → Pending → Approved/Rejected, approval oleh ADMIN/ORG_ADMIN/BEM/DEMA.  
   - Inbox/Outbox per organisasi/role (download via presigned URL).  
   - Metadata & log sederhana.

5. **Manajemen LPJ**
   - Upload LPJ (PDF) + metadata (ringkasan, realisasi anggaran).  
   - Status: Pending, Approved, Rejected.  
   - Approval BEM/DEMA dengan catatan.  
   - Revisi LPJ dengan history.

6. **Dasbor & Notifikasi**
   - Dasbor internal organisasi (ringkasan kegiatan & LPJ).  
   - Dasbor BEM/DEMA (pending approval, statistik organisasi).  
   - Notifikasi in-app: submit/approve/LPJ, reminder H-3/H-1 kegiatan, reminder LPJ.  
   - Mention manual ke user tertentu.

7. **Dasbor Publik**
   - Direktori organisasi.  
   - Kalender kegiatan publik.  
   - Galeri cover kegiatan (termoderasi).  
   - Feed RSS & ICS.

## 4. Kebutuhan Fungsional (Ringkas)

### 4.1 Modul AUTH
- Login (validasi hash password, lockout, single session).  
- Refresh token (rotasi, revoke).  
- Logout (revoke refresh token).

### 4.2 Modul ORGANIZATION
- List, detail (ID/slug), update profil (role ADMIN/ORG_ADMIN).  
- Audit log setiap perubahan profil.

### 4.3 Modul MEMBER
- Tambah anggota (ADMIN/ORG_ADMIN).  
- Update role anggota, hapus anggota.  
- Audit log tiap perubahan anggota.

### 4.4 Modul ACTIVITY
- CRUD proposal (ADMIN/ORG_ADMIN).  
- Upload proposal (PDF hanya).  
- Submit → status Pending.  
- Approve/Reject (BEM/DEMA) + catatan.  
- Revisi dengan history.  
- Mark Completed.  
- Pending list cover untuk dimoderasi BEM/DEMA.  
- Filter & pagination by status/type/tanggal.

### 4.5 Modul LPJ
- Submit LPJ (ADMIN/ORG_ADMIN) setelah kegiatan selesai.  
- Upload LPJ (PDF hanya).  
- Approve/Reject (BEM/DEMA) + catatan.  
- Revisi LPJ dengan history.  
- Filter & pagination per organisasi.

### 4.6 Modul SURAT
- Generate surat PDF dari payload/template.  
- Status: Draft, Pending, Approved, Rejected (approval oleh ADMIN/ORG_ADMIN/BEM/DEMA).  
- Inbox/Outbox per organisasi/role; upload ke Minio dan kembalikan `file_key` + presigned URL.  
- Endpoint untuk unduh/lihat metadata surat.

### 4.7 Modul PUBLIC
- List organisasi.  
- Kalender/galeri publik.  
- RSS & ICS feed.

### 4.8 Modul NOTIFICATION
- In-app notification.  
- Reminder otomatis (H-3, H-1, H+1).  
- Mention manual.

## 5. Kebutuhan Non-Fungsional

- Response API rata-rata < 800ms.  
- Load halaman utama < 3 detik (dengan frontend ringan).  
- Uptime target 99.5% (dengan monitoring manual).  
- Keamanan:
  - Password hash (bcrypt).  
  - RBAC server-side.  
  - Rate limiting per endpoint (Redis + in-memory fallback).  
  - CSP/HSTS/COOP/COEP/security headers.  
  - Upload PDF saja dengan cek MIME.  
  - Healthcheck DB/Redis/Minio.
