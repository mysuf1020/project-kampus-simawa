Berikut adalah spesifikasi endpoint tambahan yang disusun berdasarkan fitur yang **hilang** atau **belum tertulis** di `fitur.md` namun diwajibkan dalam dokumen Skripsi (berdasarkan Elisitasi Tahap Final, Struktur Database, dan Skenario Pengujian).

Anda dapat menyalin bagian ini untuk melengkapi dokumen `fitur.md` Anda.

---

## Tambahan Fitur (Missing Features Implementation)

### 13. Public Registration (Registrasi)

Fitur ini diperlukan karena skripsi mencantumkan "Terdapat Halaman Register" sebagai kebutuhan fungsional wajib (Mandatory) dan skenario pengujian `TC-USR-002`.

**Backend**: `internal/router/auth.go`
**Frontend**: `src/lib/apis/auth.ts`, `src/app/register/`

| Method | Endpoint | Fungsi | Frontend Support |
| --- | --- | --- | --- |
| POST | `/auth/register` | Registrasi pengguna baru (Mahasiswa) | ❌ (`register`) |
| POST | `/auth/verify-email` | Verifikasi email | ❌ (`verifyEmail`) |

### 14. Account Security (Keamanan Akun)

Diperlukan untuk memenuhi kebutuhan "Dapat mengubah password pengguna".

**Backend**: `internal/router/user.go`
**Frontend**: `src/lib/apis/user.ts`, `src/app/(dashboard)/settings/`

| Method | Endpoint | Fungsi | Frontend Support |
| --- | --- | --- | --- |
| PUT | `/v1/users/change-password` | Ubah kata sandi (Logged In) | ❌ (`changePassword`) |
| POST | `/auth/forgot-password` | Request reset password | ❌ (`requestResetPassword`) |
| POST | `/auth/reset-password` | Submit password baru | ❌ (`resetPassword`) |

### 15. Organization Visuals (Visual Organisasi)

Mengacu pada tabel database `Organizations` yang memiliki kolom `hero_image` dan Test Case `TC-ORG-005` "Upload hero image".

**Backend**: `internal/router/org.go`
**Frontend**: `src/lib/apis/org.ts`

| Method | Endpoint | Fungsi | Frontend Support |
| --- | --- | --- | --- |
| POST | `/v1/orgs/:id/upload-hero` | Upload banner/hero image organisasi | ❌ (`uploadOrgHero`) |
| DELETE | `/v1/orgs/:id/hero` | Hapus banner/hero image | ❌ (`deleteOrgHero`) |

### 16. Public Gallery (Galeri Kegiatan)

Mengacu pada Test Case `TC-PUB-002` "Lihat galeri kegiatan"  untuk menampilkan dokumentasi kegiatan kepada publik.

**Backend**: `internal/router/activity.go`
**Frontend**: `src/lib/apis/activity.ts`, `src/app/gallery/`

| Method | Endpoint | Fungsi | Frontend Support |
| --- | --- | --- | --- |
| GET | `/public/activities/gallery` | List semua foto dokumentasi kegiatan | ❌ (`getPublicGallery`) |
| GET | `/public/activities/:id/photos` | List foto spesifik per kegiatan | ❌ (`getActivityPhotos`) |

### 17. Reporting & Export (Laporan)

Mengacu pada Elisitasi Tahap I yang meminta "Menu laporan kegiatan organisasi" dan "Laporan surat organisasi".

**Backend**: `internal/router/report.go`
**Frontend**: `src/lib/apis/report.ts`, `src/app/(dashboard)/reports/`

| Method | Endpoint | Fungsi | Frontend Support |
| --- | --- | --- | --- |
| GET | `/v1/reports/activities/export` | Download Rekap Kegiatan (PDF/Excel) | ❌ (`exportActivityReport`) |
| GET | `/v1/reports/surat/export` | Download Rekap Surat (PDF/Excel) | ❌ (`exportSuratReport`) |
| GET | `/v1/reports/lpj/export` | Download Rekap LPJ (PDF/Excel) | ❌ (`exportLPJReport`) |

---
### 18. OTP (One Time Password)
- ketika user login harus ada otp
- user yang belum verify email gak bisa akses fitur apa apapun
- buat 1 page untuk public melihat kegiatan semua organisasi termasuk kalender kegiatan tiap organisasi, jadwal organisasi, visi misi, struktur organisasi, galeri organisasi contoh (https://pmb.raharja.ac.id/) 

### Keterangan:

* **Backend Path**: Lokasi file router yang disarankan di backend (Golang).
* **Frontend Support**: Status `❌` menandakan bahwa fungsi ini belum ada di file `fitur.md` awal dan perlu ditambahkan ke kode frontend (`src/lib/apis/...`).