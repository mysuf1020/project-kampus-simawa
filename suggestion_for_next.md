# Suggestion for Next Development - SIMAWA

## Status Saat Ini

### Build & Lint Status
| Component | Status |
|-----------|--------|
| Frontend Build | ✅ Pass |
| Backend Build | ✅ Pass |
| Backend `go vet` | ✅ Pass |
| Frontend Lint | ⚠️ Prettier warnings only (formatting, bukan error logic) |

### Task dari rekap.md yang Sudah Selesai
- ✅ Validasi wajib di Surat Create + error inline
- ✅ UI approval surat + queue
- ✅ Samakan akses /users antara FE dan BE (BEM_ADMIN, DEMA_ADMIN sekarang bisa akses)
- ✅ Revamp semua UI (modern, clean design)
- ✅ Revamp /org/[slug] seperti web portfolio
- ✅ Org members menampilkan nama user (bukan hanya ID)
- ✅ Upload foto organisasi pakai InputFile
- ✅ Template surat variant dropdown dengan search (AutoComplete + debounce)

---

## Saran Pengembangan Selanjutnya

### 1. High Priority - User Experience

#### 1.1 Join Request Auto-Link ke User
**Problem**: Saat approve join request publik, tidak otomatis mapping ke user account.

**Solution**:
```
Backend:
- Tambah lookup by email/NIM di approve handler
- Jika user ditemukan, auto-create org member
- Jika tidak, kirim email invitation untuk register

Frontend:
- Tampilkan info user yang match (jika ada) di approval dialog
- Opsi untuk create user baru jika tidak ada match
```

#### 1.2 Auto-Generate Logo Placeholder
**Problem**: Organisasi tanpa logo terlihat kosong.

**Solution**:
```typescript
// Buat komponen OrgLogoPlaceholder
function OrgLogoPlaceholder({ name }: { name: string }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const bgColor = generateColorFromString(name) // hash-based color
  return (
    <div style={{ backgroundColor: bgColor }} className="...">
      {initials}
    </div>
  )
}
```

#### 1.3 Surat Auto-Numbering
**Problem**: Nomor surat masih manual input.

**Solution**:
```
Backend:
- Tambah counter per organisasi di database
- Endpoint GET /v1/orgs/:id/next-surat-number
- Format: {ORG_CODE}/{COUNTER}/{BULAN_ROMAWI}/{TAHUN}

Frontend:
- Auto-fill nomor surat saat create
- Opsi override manual jika perlu
```

### 2. Medium Priority - Features

#### 2.1 Audit Log UI
**Problem**: Service audit sudah ada tapi belum ada UI.

**Solution**:
```
- Halaman /audit-log (admin only)
- Filter by: user, action, date range, resource
- Export ke CSV/PDF
- Real-time updates via WebSocket (optional)
```

#### 2.2 Notification Center
**Problem**: Notifikasi belum ada UI yang proper.

**Solution**:
```
- Bell icon di navbar dengan badge count
- Dropdown list notifikasi terbaru
- Halaman /notifications untuk full list
- Mark as read (single/bulk)
- Push notification (optional, via service worker)
```

#### 2.3 Multi-Level Approval Workflow
**Problem**: Approval surat hanya single level.

**Solution**:
```
- Definisi approval chain per jenis surat
- Status: PENDING_L1 -> PENDING_L2 -> APPROVED
- Timeline view untuk tracking progress
- Email notification ke approver berikutnya
```

#### 2.4 Dashboard Analytics
**Problem**: Dashboard masih basic.

**Solution**:
```
- Chart: Surat per bulan (line chart)
- Chart: Status surat (pie chart)
- Chart: Aktivitas per organisasi (bar chart)
- Quick stats: Total user, org, surat, aktivitas
- Recent activity feed
```

### 3. Low Priority - Nice to Have

#### 3.1 Dark Mode
```
- Toggle di navbar/settings
- Persist preference ke localStorage
- CSS variables sudah support (lihat globals.css)
```

#### 3.2 Export Data
```
- Export user list ke CSV
- Export surat ke PDF batch
- Export aktivitas ke Excel
- Scheduled report via email
```

#### 3.3 Global Search
```
- Search bar di navbar
- Search across: users, orgs, surat, activities
- Keyboard shortcut (Cmd+K / Ctrl+K)
- Recent searches
```

#### 3.4 File Preview
```
- Preview PDF inline (tanpa download)
- Preview image di modal
- Thumbnail untuk dokumen
```

### 4. Technical Debt

#### 4.1 Prettier Formatting
```bash
# Run untuk fix semua formatting warnings
npm run lint --prefix simawa-frontend -- --fix
# atau
npx prettier --write "simawa-frontend/src/**/*.{ts,tsx}"
```

#### 4.2 Type Safety
```
- Beberapa komponen masih pakai `any`
- Tambah strict type untuk API responses
- Generate types dari OpenAPI spec (jika ada)
```

#### 4.3 Error Handling
```
- Centralized error boundary
- Better error messages untuk user
- Retry mechanism untuk failed requests
- Offline indicator
```

#### 4.4 Performance
```
- Image optimization (next/image sudah dipakai)
- Lazy loading untuk heavy components
- React Query cache optimization
- Bundle size analysis
```

### 5. Security Improvements

#### 5.1 Rate Limiting
```
Backend:
- Implement rate limiter middleware
- Per-IP dan per-user limits
- Stricter limits untuk auth endpoints
```

#### 5.2 Input Validation
```
- Sanitize HTML input
- File type validation (magic bytes, bukan hanya extension)
- Max file size enforcement
- CSRF protection
```

#### 5.3 Captcha
```
- Add reCAPTCHA/hCaptcha untuk:
  - Public join request
  - Login (setelah N failed attempts)
  - Contact form (jika ada)
```

---

## Quick Wins (Bisa dikerjakan < 1 hari)

1. **Fix prettier warnings** - `npm run lint -- --fix`
2. **Add loading skeletons** - Better UX saat loading
3. **Add empty states** - Ilustrasi untuk halaman kosong
4. **Keyboard shortcuts** - Escape untuk close modal, Enter untuk submit
5. **Toast improvements** - Undo action, persistent untuk errors

---

## Recommended Priority Order

1. Join Request Auto-Link (high impact, medium effort)
2. Audit Log UI (compliance requirement)
3. Notification Center (user engagement)
4. Auto-Generate Logo (quick win, better UX)
5. Surat Auto-Numbering (reduces manual work)
6. Dashboard Analytics (visibility)
7. Dark Mode (user preference)
8. Global Search (productivity)

---

## Notes

- Backend sudah solid, fokus ke FE improvements
- RBAC sudah proper, tinggal polish UI
- API structure sudah RESTful dan consistent
- Consider adding OpenAPI/Swagger documentation untuk API
