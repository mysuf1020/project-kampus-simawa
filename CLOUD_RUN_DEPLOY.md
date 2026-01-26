# Panduan Deploy SIMAWA ke Google Cloud Run

## Prerequisites

1. **Google Cloud Account** dengan billing aktif
2. **Google Cloud CLI** terinstall
3. **Docker** terinstall (untuk local testing)

## Setup Awal

### 1. Install Google Cloud CLI

```bash
# macOS
brew install google-cloud-sdk

# Atau download dari https://cloud.google.com/sdk/docs/install
```

### 2. Login dan Setup Project

```bash
# Login ke Google Cloud
gcloud auth login

# Set project (ganti YOUR_PROJECT_ID)
gcloud config set project YOUR_PROJECT_ID

# Enable required APIs
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable sqladmin.googleapis.com
```

## Setup Database (Cloud SQL)

### 1. Buat Cloud SQL Instance

```bash
# Buat PostgreSQL instance
gcloud sql instances create simawa-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=asia-southeast1 \
  --root-password=YOUR_DB_PASSWORD

# Buat database
gcloud sql databases create simawa --instance=simawa-db

# Buat user
gcloud sql users create simawa_user \
  --instance=simawa-db \
  --password=YOUR_USER_PASSWORD
```

### 2. Catat Connection Info

```
DB_HOST: /cloudsql/YOUR_PROJECT_ID:asia-southeast1:simawa-db
DB_USER: simawa_user
DB_PASSWORD: YOUR_USER_PASSWORD
DB_NAME: simawa
```

## Deploy Manual (Recommended untuk pertama kali)

### 1. Deploy Backend

```bash
cd simawa-backend

# Build dan push image
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/simawa-backend

# Deploy ke Cloud Run
gcloud run deploy simawa-backend \
  --image gcr.io/YOUR_PROJECT_ID/simawa-backend \
  --region asia-southeast1 \
  --platform managed \
  --allow-unauthenticated \
  --add-cloudsql-instances YOUR_PROJECT_ID:asia-southeast1:simawa-db \
  --set-env-vars "DB_HOST=/cloudsql/YOUR_PROJECT_ID:asia-southeast1:simawa-db" \
  --set-env-vars "DB_USER=simawa_user" \
  --set-env-vars "DB_PASSWORD=YOUR_USER_PASSWORD" \
  --set-env-vars "DB_NAME=simawa" \
  --set-env-vars "DB_PORT=5432" \
  --set-env-vars "JWT_SECRET=your-jwt-secret-min-32-chars" \
  --set-env-vars "GIN_MODE=release"
```

Catat URL backend yang diberikan (contoh: `https://simawa-backend-xxxxx-as.a.run.app`)

### 2. Deploy Frontend

```bash
cd simawa-frontend

# Build dengan environment variables
gcloud builds submit \
  --tag gcr.io/YOUR_PROJECT_ID/simawa-frontend \
  --build-arg NEXT_PUBLIC_API_URL=https://simawa-backend-xxxxx-as.a.run.app

# Deploy ke Cloud Run
gcloud run deploy simawa-frontend \
  --image gcr.io/YOUR_PROJECT_ID/simawa-frontend \
  --region asia-southeast1 \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars "NEXTAUTH_URL=https://simawa-frontend-xxxxx-as.a.run.app" \
  --set-env-vars "NEXTAUTH_SECRET=your-nextauth-secret-min-32-chars"
```

## Deploy Otomatis dengan Cloud Build

### 1. Setup Cloud Build Trigger

```bash
# Connect repository (GitHub/GitLab)
gcloud beta builds triggers create github \
  --repo-name=simawa \
  --repo-owner=YOUR_GITHUB_USERNAME \
  --branch-pattern="^main$" \
  --build-config=cloudbuild.yaml \
  --substitutions=_REGION=asia-southeast1,_DB_HOST=...,_DB_USER=...,_DB_PASSWORD=...,_DB_NAME=...,_JWT_SECRET=...
```

### 2. Atau deploy manual dengan cloudbuild.yaml

```bash
gcloud builds submit \
  --config=cloudbuild.yaml \
  --substitutions=_REGION=asia-southeast1,_NEXT_PUBLIC_API_URL=https://...,_NEXTAUTH_URL=https://...,_NEXTAUTH_SECRET=...,_DB_HOST=...,_DB_USER=...,_DB_PASSWORD=...,_DB_NAME=...,_JWT_SECRET=...
```

## Setup Custom Domain (Opsional)

```bash
# Map custom domain ke frontend
gcloud beta run domain-mappings create \
  --service simawa-frontend \
  --domain simawa.yourdomain.com \
  --region asia-southeast1

# Map custom domain ke backend (API)
gcloud beta run domain-mappings create \
  --service simawa-backend \
  --domain api.simawa.yourdomain.com \
  --region asia-southeast1
```

## Environment Variables

### Backend (.env)
```env
DB_HOST=/cloudsql/PROJECT_ID:REGION:INSTANCE_NAME
DB_USER=simawa_user
DB_PASSWORD=your_password
DB_NAME=simawa
DB_PORT=5432
JWT_SECRET=your-jwt-secret-minimum-32-characters
GIN_MODE=release
PORT=8080
```

### Frontend
```env
NEXT_PUBLIC_API_URL=https://simawa-backend-xxxxx-as.a.run.app
NEXTAUTH_URL=https://simawa-frontend-xxxxx-as.a.run.app
NEXTAUTH_SECRET=your-nextauth-secret-minimum-32-characters
```

## Estimasi Biaya

| Service | Estimasi/bulan |
|---------|----------------|
| Cloud Run (low traffic) | $0-10 |
| Cloud SQL (db-f1-micro) | ~$10-15 |
| Cloud Storage | ~$1-5 |
| **Total** | **~$15-30** |

*Cloud Run memiliki free tier: 2 juta requests/bulan gratis*

## Troubleshooting

### 1. Container gagal start
```bash
# Cek logs
gcloud run services logs read simawa-backend --region asia-southeast1
gcloud run services logs read simawa-frontend --region asia-southeast1
```

### 2. Database connection error
- Pastikan Cloud SQL Admin API enabled
- Pastikan service account punya role `Cloud SQL Client`
- Cek format DB_HOST: `/cloudsql/PROJECT:REGION:INSTANCE`

### 3. Build error
```bash
# Cek build logs
gcloud builds list --limit=5
gcloud builds log BUILD_ID
```

## Quick Commands

```bash
# Lihat services
gcloud run services list --region asia-southeast1

# Lihat revisions
gcloud run revisions list --service simawa-frontend --region asia-southeast1

# Update environment variable
gcloud run services update simawa-backend \
  --set-env-vars "NEW_VAR=value" \
  --region asia-southeast1

# Scale to zero (hemat biaya saat tidak dipakai)
gcloud run services update simawa-backend \
  --min-instances 0 \
  --region asia-southeast1
```
