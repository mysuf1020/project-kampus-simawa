# Analisis Fitur SIMAWA (Backend vs Frontend)

Dokumen ini berisi pemetaan fitur antara Backend (API Endpoints) dan Frontend (API Client/Pages).

## Ringkasan
Secara umum, seluruh endpoint utama di backend telah memiliki pasangan implementasi client di frontend.

## Detail Fitur

### 1. Authentication (Otentikasi)
**Backend**: `internal/router/auth.go`
**Frontend**: `src/lib/apis/auth.ts`, `src/app/login/`
| Method | Endpoint | Fungsi | Frontend Support |
|--------|----------|--------|------------------|
| POST | `/auth/login` | Login user | ✅ (`login`) |
| POST | `/auth/refresh` | Refresh token | ✅ (`refreshToken`) |
| POST | `/auth/logout` | Logout user | ✅ (`logout`) |

### 2. User Management (Pengguna)
**Backend**: `internal/router/user.go`
**Frontend**: `src/lib/apis/user.ts`, `src/app/(dashboard)/users/`
| Method | Endpoint | Fungsi | Frontend Support |
|--------|----------|--------|------------------|
| GET | `/v1/users/search` | Cari user | ✅ (`searchUsers`) |
| POST | `/v1/users` | Buat user baru (Admin) | ✅ (`createUser`) |
| GET | `/v1/users` | List user | ✅ (`getUsers`) |
| GET | `/v1/users/:id` | Detail user | ✅ (`getUser`) |
| GET | `/v1/users/:id/roles` | List roles user | ✅ (`getUserRoles`) |
| POST | `/v1/users/:id/roles` | Assign roles | ✅ (`assignUserRoles`) |

### 3. Organization (Organisasi)
**Backend**: `internal/router/org.go`
**Frontend**: `src/lib/apis/org.ts`, `src/app/(dashboard)/organizations/`
| Method | Endpoint | Fungsi | Frontend Support |
|--------|----------|--------|------------------|
| GET | `/orgs` | List org (Public) | ✅ (`getOrgsPublic`) |
| GET | `/orgs/:id` | Detail org (Public) | ✅ (`getOrgPublic`) |
| GET | `/orgs/slug/:slug` | Profil org (Public Slug) | ✅ (`getOrgBySlug`) |
| GET | `/v1/orgs` | List org (Auth) | ✅ (`getOrgs`) |
| PUT | `/v1/orgs/:id` | Update org | ✅ (`updateOrg`) |
| POST | `/v1/orgs/:id/upload` | Upload logo org | ✅ (`uploadOrgImage`) |

### 4. Organization Membership (Anggota)
**Backend**: `internal/router/member.go`
**Frontend**: `src/lib/apis/member.ts`
| Method | Endpoint | Fungsi | Frontend Support |
|--------|----------|--------|------------------|
| POST | `/v1/orgs/:id/members` | Tambah anggota | ✅ (`addMember`) |
| PUT | `/v1/orgs/:id/members/:user_id` | Update anggota | ✅ (`updateMember`) |
| DELETE | `/v1/orgs/:id/members/:user_id` | Hapus anggota | ✅ (`removeMember`) |
| GET | `/v1/orgs/:id/members` | List anggota | ✅ (`getMembers`) |

### 5. Join Requests (Pendaftaran Anggota)
**Backend**: `internal/router/join_request.go`
**Frontend**: `src/lib/apis/org-join.ts`
| Method | Endpoint | Fungsi | Frontend Support |
|--------|----------|--------|------------------|
| POST | `/public/orgs/:id/join-requests` | Daftar ke org | ✅ (`submitJoinRequest`) |
| GET | `/v1/orgs/:id/join-requests` | List request | ✅ (`getJoinRequests`) |
| PATCH | `/v1/orgs/:id/join-requests/:request_id` | Terima/Tolak | ✅ (`respondJoinRequest`) |

### 6. Activities / Proposal (Kegiatan)
**Backend**: `internal/router/activity.go`
**Frontend**: `src/lib/apis/activity.ts`, `src/app/(dashboard)/activities/`
| Method | Endpoint | Fungsi | Frontend Support |
|--------|----------|--------|------------------|
| GET | `/public/activities` | List kegiatan (Public) | ✅ (`getPublicActivities`) |
| GET | `/public/activities.rss` | RSS Feed | ✅ (`getPublicActivitiesRSS`) |
| GET | `/public/activities.ics` | Calendar ICS | ✅ (`getPublicActivitiesICS`) |
| POST | `/v1/activities/upload` | Upload proposal | ✅ (`uploadProposal`) |
| DELETE | `/v1/activities/upload` | Hapus proposal | ✅ (`deleteProposal`) |
| POST | `/v1/activities` | Buat kegiatan | ✅ (`createActivity`) |
| POST | `/v1/activities/:id/submit` | Submit kegiatan | ✅ (`submitActivity`) |
| POST | `/v1/activities/:id/approve` | Approve (BEM/DEMA) | ✅ (`approveActivity`) |
| POST | `/v1/activities/:id/revision` | Minta Revisi | ✅ (`reviseActivity`) |
| POST | `/v1/activities/:id/cover` | Approve Cover | ✅ (`approveCover`) |
| GET | `/v1/activities/pending-cover` | List Pending Cover | ✅ (`getPendingCoverActivities`) |
| GET | `/v1/activities/org/:org_id` | List by Org | ✅ (`getOrgActivities`) |

### 7. LPJ (Laporan Pertanggungjawaban)
**Backend**: `internal/router/lpj.go`
**Frontend**: `src/lib/apis/lpj.ts`, `src/app/(dashboard)/lpj/`
| Method | Endpoint | Fungsi | Frontend Support |
|--------|----------|--------|------------------|
| POST | `/v1/lpj/upload` | Upload LPJ | ✅ (`uploadLPJ`) |
| POST | `/v1/lpj/submit` | Submit LPJ | ✅ (`submitLPJ`) |
| POST | `/v1/lpj/:lpj_id/approve` | Approve LPJ | ✅ (`approveLPJ`) |
| POST | `/v1/lpj/:lpj_id/revision` | Revisi LPJ | ✅ (`reviseLPJ`) |
| GET | `/v1/lpj/:lpj_id` | Detail LPJ | ✅ (`getLPJDetail`) |
| GET | `/v1/lpj/:lpj_id/download` | Download LPJ | ✅ (`downloadLPJ`) |
| GET | `/v1/lpj/org/:org_id` | List LPJ by Org | ✅ (`getOrgLPJs`) |

### 8. Surat (Correspondence)
**Backend**: `internal/router/surat.go`
**Frontend**: `src/lib/apis/surat.ts`, `src/app/(dashboard)/surat/`
| Method | Endpoint | Fungsi | Frontend Support |
|--------|----------|--------|------------------|
| POST | `/v1/surat` | Buat Surat | ✅ (`createSurat`) |
| POST | `/v1/surat/preview` | Preview Surat | ✅ (`previewSurat`) |
| POST | `/v1/surat/:id/submit` | Submit Surat | ✅ (`submitSurat`) |
| POST | `/v1/surat/:id/approve` | Approve Surat | ✅ (`approveSurat`) |
| POST | `/v1/surat/:id/revise` | Revisi Surat | ✅ (`reviseSurat`) |
| GET | `/v1/surat/outbox/:org_id` | Surat Keluar | ✅ (`getOutbox`) |
| GET | `/v1/surat/inbox` | Surat Masuk | ✅ (`getInbox`) |
| GET | `/v1/surat/archive` | Arsip Surat | ✅ (`getArchive`) |
| GET | `/v1/surat` | List Semua | ✅ (`getAllSurat`) |
| GET | `/v1/surat/:id` | Detail Surat | ✅ (`getSuratDetail`) |
| GET | `/v1/surat/:id/download` | Download Surat | ✅ (`downloadSurat`) |

### 9. Dashboard
**Backend**: `internal/router/dashboard.go`
**Frontend**: `src/lib/apis/dashboard.ts`, `src/app/(dashboard)/dashboard/`
| Method | Endpoint | Fungsi | Frontend Support |
|--------|----------|--------|------------------|
| GET | `/v1/dashboard/summary` | Statistik Dashboard | ✅ (`getSummary`) |

### 10. Notifications
**Backend**: `internal/router/notification.go`
**Frontend**: `src/lib/apis/notification.ts`
| Method | Endpoint | Fungsi | Frontend Support |
|--------|----------|--------|------------------|
| GET | `/v1/notifications` | List notifikasi | ✅ (`getNotifications`) |
| POST | `/v1/notifications/:id/read` | Tandai dibaca | ✅ (`markAsRead`) |
| POST | `/v1/notifications/mention` | Mention user (Internal) | ✅ (`mentionUser`) |

### 11. Audit Logs
**Backend**: `internal/router/audit.go`
**Frontend**: `src/lib/apis/audit.ts`, `src/app/(dashboard)/audit/`
| Method | Endpoint | Fungsi | Frontend Support |
|--------|----------|--------|------------------|
| GET | `/v1/audit` | List audit logs | ✅ (`getAuditLogs`) |

### 12. Health Check
**Backend**: `internal/router/health.go`
**Frontend**: `src/lib/apis/health.ts`
| Method | Endpoint | Fungsi | Frontend Support |
|--------|----------|--------|------------------|
| GET | `/health` | Cek status server | ✅ (`checkHealth`) |
