---
description: Build and Deployment Rules
---

# Deploy Workflow Rules

Ketika ada perubahan pada aplikasi SIMAWA, ikuti aturan berikut sebelum melakukan commit dan push:

1. **JIKA HANYA ADA PERUBAHAN DI FRONTEND (FE):**
   - **TIDAK BOLEH** langsung commit dan push.
   - **DIWAJIBKAN** menjalankan `bun run lint` dan `bun run build`.
   - Perbaiki semua error linting dan build yang muncul.
   - Commit dan push **hanya** jika diminta secara eksplisit atau digabung dengan perubahan Backend.

2. **JIKA ADA PERUBAHAN DI FRONTEND (FE) DAN BACKEND (BE):**
   - Jalankan `bun run lint` dan `bun run build` di Frontend.
   - Pastikan backend bisa di-build/run tanpa error.
   - **BOLEH** langsung commit dan push ke repository.
   - Cloud Build akan otomatis ter-trigger.

// turbo
3. **Contoh Perintah Frontend (Wajib):**
```bash
cd simawa-frontend
bun run lint
bun run build
```
