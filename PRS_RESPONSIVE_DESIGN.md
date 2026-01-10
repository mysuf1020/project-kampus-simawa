# PRS: Responsive Design & Infinite Scroll Implementation

**Tanggal:** 10 Januari 2026  
**Versi:** 1.0  
**Status:** Completed

---

## 1. Ringkasan Eksekutif

Dokumen ini menjelaskan implementasi responsive design dan infinite scroll untuk aplikasi SIMAWA. Perubahan ini mencakup:

1. **Sidebar/Navbar**: Hamburger menu untuk semua ukuran layar (desktop, tablet, mobile)
2. **Responsive Layout**: Penyesuaian tampilan untuk berbagai ukuran layar
3. **Infinite Scroll**: Implementasi infinite scroll untuk mobile view, menggantikan pagination

---

## 2. Perubahan Frontend

### 2.1 Komponen Baru

#### `InfiniteScrollLoader`
**File:** `src/components/ui/infinite-scroll-loader.tsx`

Komponen baru untuk mendeteksi scroll dan memuat data berikutnya secara otomatis menggunakan `IntersectionObserver`.

```typescript
Props:
- onLoadMore: () => void      // Callback untuk memuat data berikutnya
- isLoading?: boolean         // Status loading
- hasMore?: boolean           // Apakah masih ada data berikutnya
```

---

### 2.2 Sidebar & Layout

#### Sidebar (`src/app/(dashboard)/_components/sidebar.tsx`)
- **Sebelum:** Desktop menggunakan sidebar sticky, mobile menggunakan drawer
- **Sesudah:** Semua ukuran layar menggunakan hamburger menu + drawer
- Header sticky dengan tombol hamburger di kiri, logo di tengah
- Sidebar slide-in dari kiri sebagai drawer
- Overlay gelap saat sidebar terbuka
- Sidebar otomatis tertutup saat navigasi

#### Layout (`src/app/(dashboard)/layout.tsx`)
- Simplified layout karena sidebar sekarang selalu drawer
- Padding responsive: `p-3` mobile, `sm:p-4` tablet, `md:p-6` desktop

---

### 2.3 Halaman Activities (`/activities`)

#### File yang Diubah:
1. `src/app/(dashboard)/activities/page.tsx`
2. `src/app/(dashboard)/activities/_components/activity-list.tsx`
3. `src/app/(dashboard)/activities/_components/filter-activities.tsx`

#### Perubahan:
- **TabsList**: `flex-wrap`, `h-auto`, text lebih kecil di mobile
- **FilterActivities**: Dipisah menjadi 2 baris untuk mobile
- **ActivityList**: 
  - Grid: 1 kolom di mobile, 2 di sm, 3 di lg
  - Desktop: Pagination dengan `hidden sm:flex`
  - Mobile: Infinite scroll dengan `sm:hidden`
- **Page**: Menggunakan `useInfiniteQuery` untuk mobile view

---

### 2.4 Halaman Surat (`/surat`)

#### File yang Diubah:
1. `src/app/(dashboard)/surat/page.tsx`
2. `src/app/(dashboard)/surat/_components/inbox-list.tsx`
3. `src/app/(dashboard)/surat/_components/outbox-list.tsx`

#### Perubahan:
- **TabsList**: `flex-wrap`, `h-auto`, text lebih kecil di mobile
- **InboxListCard**: CardHeader responsive, buttons icon-only di mobile
- **OutboxListCard**: 
  - CardHeader responsive
  - Item list: `flex-col` di mobile
  - Desktop: Pagination dengan `hidden sm:flex`
  - Mobile: Infinite scroll dengan `sm:hidden`
- **Page**: Menggunakan `useInfiniteQuery` untuk outbox di mobile view

---

### 2.5 Halaman Surat Templates (`/surat/templates`)

#### File yang Diubah:
1. `src/app/(dashboard)/surat/_components/template-builder.tsx`

#### Perubahan:
- Layout: `flex-col` di mobile, grid di lg
- Form di atas, template list di bawah di mobile
- Buttons responsive dengan icon-only di mobile

---

### 2.6 Halaman LPJ (`/lpj`)

#### File yang Diubah:
1. `src/app/(dashboard)/lpj/page.tsx`
2. `src/app/(dashboard)/lpj/_components/filter-lpj.tsx`
3. `src/app/(dashboard)/lpj/_components/list-card.tsx`

#### Perubahan:
- **FilterLPJ**: Dipisah menjadi 2 baris untuk mobile
- **LPJListCard**:
  - CardHeader responsive
  - Grid: 1 kolom di mobile, 2 di sm, 3 di lg
  - Desktop: Pagination dengan `hidden sm:flex`
  - Mobile: Infinite scroll dengan `sm:hidden`
- **Page**: Menggunakan `useInfiniteQuery` untuk mobile view

---

### 2.7 Halaman Organizations (`/organizations`)

#### File yang Diubah:
1. `src/app/(dashboard)/organizations/page.tsx`

#### Perubahan:
- **TabsList**: `flex-wrap`, `h-auto`, text lebih kecil di mobile
- **Grid**: 1 kolom di mobile, 2 di lg

---

### 2.8 Halaman Users (`/users`)

#### File yang Diubah:
1. `src/app/(dashboard)/users/page.tsx`

#### Perubahan:
- **CardHeader**: Responsive dengan `flex-col` di mobile
- **Desktop View**: Pagination dengan `hidden sm:block`
- **Mobile View**: Infinite scroll dengan `sm:hidden`
- Menggunakan `useInfiniteQuery` untuk mobile view

---

## 3. Pattern Implementasi

### 3.1 Responsive Breakpoints

| Breakpoint | Ukuran | Penggunaan |
|------------|--------|------------|
| Default | < 640px | Mobile |
| `sm:` | ≥ 640px | Tablet / Desktop |
| `md:` | ≥ 768px | Desktop |
| `lg:` | ≥ 1024px | Large Desktop |

### 3.2 Pattern Mobile vs Desktop View

```tsx
{/* Desktop View */}
<div className="hidden sm:block">
  <ComponentWithPagination
    page={page}
    onChangePage={onChangePage}
  />
</div>

{/* Mobile View with Infinite Scroll */}
<div className="sm:hidden">
  <ComponentWithInfiniteScroll
    hasNextPage={hasNextPage}
    onLoadMore={() => fetchNextPage()}
    isFetchingNextPage={isFetchingNextPage}
  />
</div>
```

### 3.3 useInfiniteQuery Pattern

```tsx
const infiniteQuery = useInfiniteQuery({
  queryKey: ['data-infinite', ...filters],
  queryFn: ({ pageParam = 1 }) => fetchData({ page: pageParam, ...filters }),
  enabled: Boolean(requiredParam),
  initialPageParam: 1,
  getNextPageParam: (lastPage, allPages) => {
    const totalItems = lastPage.total ?? 0
    const loadedItems = allPages.reduce((acc, p) => acc + (p.items?.length ?? 0), 0)
    if (loadedItems < totalItems) {
      return allPages.length + 1
    }
    return undefined
  },
})

// Combine all pages
const allItems = useMemo(
  () => infiniteQuery.data?.pages.flatMap((p) => p.items ?? []) ?? [],
  [infiniteQuery.data?.pages]
)
```

---

## 4. Komponen yang Dimodifikasi

### 4.1 Props Baru untuk List Components

Semua komponen list sekarang menerima props tambahan untuk infinite scroll:

```typescript
type Props = {
  // ... existing props
  hasNextPage?: boolean
  onLoadMore?: () => void
  isFetchingNextPage?: boolean
}
```

### 4.2 Komponen yang Terpengaruh

| Komponen | File |
|----------|------|
| ActivityList | `activities/_components/activity-list.tsx` |
| OutboxListCard | `surat/_components/outbox-list.tsx` |
| LPJListCard | `lpj/_components/list-card.tsx` |

---

## 5. Testing Checklist

### 5.1 Responsive Design
- [ ] Sidebar hamburger menu berfungsi di desktop
- [ ] Sidebar hamburger menu berfungsi di tablet
- [ ] Sidebar hamburger menu berfungsi di mobile
- [ ] Sidebar tertutup otomatis saat navigasi

### 5.2 Halaman Activities
- [ ] TabsList responsive di mobile
- [ ] Filter responsive di mobile
- [ ] Grid 1 kolom di mobile
- [ ] Infinite scroll berfungsi di mobile
- [ ] Pagination berfungsi di desktop

### 5.3 Halaman Surat
- [ ] TabsList responsive di mobile
- [ ] Inbox list responsive di mobile
- [ ] Outbox infinite scroll berfungsi di mobile
- [ ] Outbox pagination berfungsi di desktop

### 5.4 Halaman LPJ
- [ ] Filter responsive di mobile
- [ ] List grid 1 kolom di mobile
- [ ] Infinite scroll berfungsi di mobile
- [ ] Pagination berfungsi di desktop

### 5.5 Halaman Users
- [ ] CardHeader responsive di mobile
- [ ] Infinite scroll berfungsi di mobile
- [ ] Pagination berfungsi di desktop

### 5.6 Halaman Organizations
- [ ] TabsList responsive di mobile
- [ ] Grid 1 kolom di mobile

---

## 6. Catatan Teknis

### 6.1 IntersectionObserver
Komponen `InfiniteScrollLoader` menggunakan `IntersectionObserver` untuk mendeteksi kapan user scroll mendekati akhir list. Ini lebih efisien daripada event listener scroll.

### 6.2 Dual Query Strategy
Untuk halaman dengan list, digunakan 2 query:
1. `useQuery` untuk desktop dengan pagination
2. `useInfiniteQuery` untuk mobile dengan infinite scroll

Ini memastikan pengalaman optimal di kedua platform tanpa mengorbankan performa.

### 6.3 CSS Classes
- `hidden sm:block` - Sembunyikan di mobile, tampilkan di sm+
- `sm:hidden` - Tampilkan di mobile, sembunyikan di sm+
- `flex-wrap h-auto` - Untuk TabsList yang responsive

---

## 7. Perubahan Backend

Tidak ada perubahan backend yang diperlukan untuk implementasi ini. API yang ada sudah mendukung pagination dengan parameter `page` dan `size`.

---

## 8. Kesimpulan

Implementasi responsive design dan infinite scroll telah selesai untuk semua halaman yang diminta:

1. ✅ `/activities` - Infinite scroll di mobile
2. ✅ `/surat?tab=outbox` - Infinite scroll di mobile
3. ✅ `/lpj` - Infinite scroll di mobile
4. ✅ `/users` - Infinite scroll di mobile
5. ✅ `/organizations` - Responsive layout
6. ✅ `/surat/templates` - Responsive layout
7. ✅ Sidebar - Hamburger menu untuk semua ukuran layar

Semua perubahan mengikuti pattern yang konsisten dan menggunakan Tailwind CSS breakpoints untuk responsiveness.
