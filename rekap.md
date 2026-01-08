# Rekap SIMAWA (Frontend + Backend) - Detail

## Scope dan konteks
- Rekap ini merangkum kondisi aktual codebase FE/BE, termasuk fitur, endpoint, model data, dan flow yang berjalan.
- Tujuan: menjadi referensi teknis sekaligus bahan roadmap agar produk terasa enterprise.

## Arsitektur dan stack
- Frontend: Next.js 15 (app router), React 19, Tailwind CSS, TanStack Query (data fetching/cache), Jotai (state form), NextAuth (session), Radix UI components.
- Backend: Go + Gin, GORM (SQL DB), Redis, Minio, JSONB untuk payload surat dan gallery.
- Integrasi FE -> BE: proxy ` /api/simawa/[...path] ` ke `NEXT_PUBLIC_API_BASE_URL` (default `http://localhost:8080`).
- Autentikasi: JWT access token + refresh token; FE simpan token di session NextAuth.

## Model data utama (field penting)
- User: id, username, first_name, second_name, organisasi (bool), ukm, hmj, jurusan, nim, email, phone, alamat, birth_date, created_at, updated_at.
- Organization: id, name, slug, type (BEM/DEMA/UKM/HMJ/OTHER), description, logo_key, logo_url, hero_image, contact_email/phone, website/instagram/twitter/linkedin, links (JSON), gallery_urls (JSON).
- UserRole: user_id, role_code, org_id (optional scope).
- OrgMember: org_id, user_id, role (ADMIN/MEMBER/dll).
- OrgJoinRequest: org_id, user_id (optional), applicant_name/email/nim/phone/jurusan, message, status (PENDING/APPROVED/REJECTED), decision_note, reviewed_at/by.
- Surat: org_id, target_org_id, variant, status (DRAFT/PENDING/APPROVED/REJECTED), number, subject, to_role/name/place/city, file_key/url, approval_note, meta_json.
- SuratTemplate: name, variant, theme_json, payload_json, description.
- Notification: user_id, title, body, data (JSON), read_at.

## Frontend detail (routes + fitur)
- /login: form email/password; NextAuth credentials; redirect ke /dashboard setelah valid.
- /dashboard: landing admin; header sticky, sidebar, gating menu via RBAC.
- /public: landing publik aktivitas; fetch /public/activities; tombol RSS/ICS.
- /org/[slug]: profil publik org; hero/logo/section; tombol "Registrasi anggota" (dialog) yang kirim join request public.
- /organizations: tab "Profil Organisasi", "Anggota organisasi", "Pendaftaran anggota"; gunakan can_manage dari API.
- /users: list user + badges role; search by nama/email/NIM; filter admin organisasi (ORG_*).
- /settings: role guide card lengkap, role management (assign role global), create user, health status.
- /surat/create + /surat-create alias: create surat step-by-step; preview; submit; download.
- /activities, /reports, /lpj, /surat list: halaman dasar untuk admin.

## Frontend detail kecil yang penting
- AutoComplete: search remote via /v1/users/search; input bisa search nama/email/NIM.
- Role chips: pilihan role global disimpan sebagai list di UI; klik badge untuk hapus.
- Upload logo/hero: InputFile -> base64 untuk kop surat; upload org image ke /v1/orgs/:id/upload.
- Surat Create: kop surat bisa toggle; jika off, header diambil dari data organisasi.
- Template surat: create/list/delete/render (PDF) via panel samping.

## Backend API detail (domain utama)
- Auth: POST /auth/login, /auth/refresh, /auth/logout.
- Health: GET /health (DB/Redis/Minio status + uptime).
- Users (admin only): POST /v1/users, GET /v1/users, GET /v1/users/:id, GET /v1/users/:id/roles, POST /v1/users/:id/roles.
- User search (admin + org admin): GET /v1/users/search?q=&size=.
- Organizations: GET /orgs, GET /orgs/:id, GET /orgs/slug/:slug, GET /v1/orgs, PUT /v1/orgs/:id, POST /v1/orgs/:id/upload?kind=hero|logo.
- Org members: GET/POST /v1/orgs/:id/members, PUT /v1/orgs/:id/members/:user_id, DELETE /v1/orgs/:id/members/:user_id.
- Org join requests: POST /public/orgs/:id/join-requests, GET /v1/orgs/:id/join-requests?status=, PATCH /v1/orgs/:id/join-requests/:request_id.
- Surat: POST /v1/surat, POST /v1/surat/preview, POST /v1/surat/:id/submit, POST /v1/surat/:id/approve, GET /v1/surat/:id/download, GET /v1/surat/outbox/:org_id, GET /v1/surat/inbox, GET /v1/surat.
- Surat templates: POST/GET/PUT/DELETE /v1/surat/templates, POST /v1/surat/pdf-from-template.
- Activities: GET /public/activities, /public/activities.rss, /public/activities.ics; POST /v1/activities, /upload, /:id/submit, /:id/approve, /:id/revision, /:id/cover, GET /v1/activities/pending-cover, GET /v1/activities/org/:org_id.
- Notifications: GET /v1/notifications, POST /v1/notifications/:id/read, POST /v1/notifications/mention.
- RBAC: role global ADMIN/BEM_ADMIN/DEMA_ADMIN/USER; role org-scope ORG_<SLUG> + legacy ORG_ADMIN; ORG_<SLUG> dibuat otomatis saat org member diberi role ADMIN.

## Flow keseluruhan (end-to-end)
- Flow login: /login -> POST /auth/login -> NextAuth simpan access/refresh -> redirect /dashboard -> refresh token otomatis saat expired.
- Flow role global: Settings -> search user -> assign role -> POST /v1/users/:id/roles -> role muncul di /users.
- Flow org profile: /organizations -> pilih org -> update profil -> PUT /v1/orgs/:id -> upload logo/hero -> POST /v1/orgs/:id/upload.
- Flow org member (admin): /organizations (tab Anggota) -> search user -> GET /v1/users/search -> add member -> POST /v1/orgs/:id/members -> sistem buat ORG_<SLUG>.
- Flow registrasi anggota (publik): /org/[slug] -> dialog registrasi -> POST /public/orgs/:id/join-requests -> status PENDING -> admin review di /organizations tab Pendaftaran -> PATCH approve/reject.
- Flow surat: /surat/create -> isi form -> preview -> POST /v1/surat/preview -> submit -> POST /v1/surat -> POST /v1/surat/:id/submit -> download -> GET /v1/surat/:id/download.
- Flow template surat: /surat/create sidebar -> create template -> POST /v1/surat/templates -> render -> POST /v1/surat/pdf-from-template.
- Flow activity publik: admin create -> /v1/activities -> approve -> public feed /public/activities + RSS/ICS.
- Flow notifikasi: admin send mention dari org members -> POST /v1/notifications/mention -> user lihat list notifications.

## Gap dan flow kurang oke (detail)
- /users list di backend hanya RoleAdmin; FE memberi akses menu untuk BEM_ADMIN/DEMA_ADMIN, tapi akan 403.
- Org join request publik tidak membuat user account; saat approve tanpa user_id tidak otomatis jadi anggota.
- Validasi surat di FE belum ketat (perihal/penerima/penandatangan bisa kosong).
- Approval surat ada endpoint tetapi belum ada UI workflow (approve/reject note, queue).
- Role management masih manual; belum ada policy editor atau permission matrix non-dev.
- Belum ada audit log UI walau service audit sudah ada.
- Public page belum punya CMS block editor; konten masih statis/terbatas.
- Monitoring baru sebatas health sederhana.

## Saran enterprise (lebih rinci)
- Role & permission: policy matrix per resource/action; scope per org dan unit; UI policy editor.
- Workflow: approval surat multi-level, auto numbering, template var, status timeline.
- CMS: block editor + versioning + staging publish + audit.
- Security: SSO/MFA, rate limit, captcha registrasi anggota, file scanning.
- Observability: centralized logs, error tracking, audit trail dashboard.
- Data ops: export CSV/PDF, global search, backup & retention policy.
- Belum ada pembuatan template dan pakai template untuk pembuatan surat

## Next action yang paling realistis
- Validasi wajib di Surat Create + error inline.
- UI approval surat + queue.
- Samakan akses /users antara FE dan BE.
- Mapping join request publik ke user (lookup by email/nim).
- Revamp semua UI buat lebih fresh dan kekinian gak norak
- Revamp ui dan flow /org/[slug], buat agar seperti web porto organisasi ataupun web porto perusahaan, dan buat ketika user org mau membuat nya lebih mudah, dan gampang untuk di edit
- Logo organisasi juga di buat const sesuai dengan nama organisasi tersebut

## Tambahan
- Pada organizations, list org member itu harus nya munculin nama dan organisasi nya apa, gak mungkin dong admin harus cari id, kamu pahamin apa yg mau saya bikin lalu lakuin semestinya dan jangan lupa detail, dan berfikir as a user. jika perlu perubahan di be lakukan dan jika perlu perubahan di fe lakukan juga buat semaksimal mungkin, dan jika kamu punya ide tambahan beritahu saya kira kira fitur apa yang perlu di buat 
- http://localhost:3000/organizations pada Pengaturan organisasi untuk upload foto lebih baik input file aja di banding nya begitu
- ui revamp keseluruhan nya ngikutin dari /Users/mysuf/GitHub/quickbill-platform 
- Template surat kan itu ada variant harus nya drop down, dan buat saja dropdown search jadi ketika search itu di buat debounce biar gak nge fetch terus