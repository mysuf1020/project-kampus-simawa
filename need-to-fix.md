okey ini yg perlu di ubah 
first http://localhost:3001/org 
1. di organisasi yg munculin semua organisasi, disitu harus nya logo layer nya paling atas hero di belakang nya
2. ketika card organisasi di tekan itu langsung direct ke organisasi tersebut 
3. kalender kegiatan harus nya di bagi menjadi 2 kegiatan yang akan datang dan kegiatan yang terlewat dan semua kegiatan, tetapi itu di ambil dari sesuai kegiatan paling baru

second http://localhost:3001/dashboard overview tab / overview page
1. notifikasi seperti nya kurang jelas kegunaan dan peruntukan nya
2. button export data juga belum jelas kegunaan nya
3. button refresh seperti nya tidak di perlukan

third http://localhost:3001/activities Aktifitas tab / Aktivitas page
1. Daftar Aktivitas harus nya di bagi menjadi 2 Aktivitas yang akan datang dan Aktivitas yang terlewat dan semua Aktivitas, tetapi itu di ambil dari sesuai Aktivitas paling baru
2. filter organisasi harus nya ada 1 tambahan yaitu semua organisasi, jadi ketika di pilih semua organisasi maka akan muncul semua aktivitas
3. di filter status itu di buat lebih jelas sesuai dengan flow, karena harus nya setelah di setujui, bila waktu telah lewat maka akan di arahkan ke status selesai
4. di buat aktivitas upload proposal belum jelas masuk ke mana setelah di upload, dan belum jelas kemana tujuan di upload proposal, itu di buat di perjelasnya, sebenar nya harus nya sama tetapi untuk acara acara besar seperti seminar, workshop, ataupun lomba, dan itu perlukan proposal, nah itu akan masuk ke bem file yg terlah di upload nya

fourth http://localhost:3001/surat Buat Surat tab / Buat surat page 
okey penjelasan : jenis surat sekarang ada 4 Surat Peminjaman, Surat Pengajuan, Surat Permohonan, Surat Undangan
1. http://localhost:3001/surat di page ini perlu tambahan yaitu surat peminjaman, nah disana kamu perlu membuat form surat peminjaman, yang isi nya jenis barang dan itu sesuai asset dari organisasi tersebut, jadi kamu perlu buat page asset organisasi, yang disitu bisa tambah hapus dan edit asset organisasi, disitu juga berkaitan dengan surat jika surat di approve maka asset tersebut akan di buat status apakah itu di pinjam, dan perlu tanggal peminjaman dan tanggal pengembalian asset
2. http://localhost:3001/surat/create disini perlu di hilangkan jenis surat peminjaman karena akan ada page baru surat peminjaman 

fifth http://localhost:3001/arsip Arsip surat tab / Arsip surat page
1. perlu tambahan filter sesuai dengan jenis surat tersebut
2. filter organisasi perlu di tambahin semua organisasi
3. disitu card yang memberikan informasi tentang surat, pengirim nya bem berikan username dari pengerim surat 
4. button refresh tidak perlu

sixth http://localhost:3001/lpj LPJ & Laporan tab / LPJ & Laporan page
1. di daftar lpj perlu lebih jelas pengirim nya siapa dan dari organisasi mana
2. filter organisasi perlu di tambahin semua organisasi

seventh http://localhost:3001/organizations Organisasi tab / Organisasi page
1. di tablist anggota, itu perlu filter semua organisasi, tetapi jika dia sudah punya organisasi maka filter status nya langsung ke organisasi tersebut
2. di tablist struktur, itu perlu filter semua organisasi, tetapi jika dia sudah punya organisasi maka filter status nya langsung ke organisasi tersebut
3. di tablist pendaftaran, itu perlu filter semua organisasi, tetapi jika dia sudah punya organisasi maka filter status nya langsung ke organisasi tersebut 
4. di Pendaftaran Anggota perlu lebih detail sesuai yang di input oleh user tersebut

eight http://localhost:3001/users Pengguna tab / Pengguna page
1. filter organisasi itu samain aja dengan filter lain jangan input filter
2. disitu juga bisa edit role, contoh bem ingin menghapus amel dari role bem dan dema, maka disitu bisa, dan jika ingin menambahkan disitu juga bisa
3. button tambah user tidak perlu
4. button refresh tidak perlu

ninth http://localhost:3001/audit Audit log tab / Audit log page
1. entitas itu harus nya menunjukan dari organisasi mana
2. ip address harus nya memunculkan ip address dari user yang melakukan audit

tenth http://localhost:3001/settings Pengaturan tab / Pengaturan page
1. Kelola Akses Global coba sesuaikan lagi role nya antara bem, dema dan admin itu dropdown saja tidak perlu input dropdown
2. Buat Akun Baru tidak perlu ada biar user buat dari page public saja 
3. ganti password perlu dari admin/bem/dema

noted jika role hanya user terkait rbac kasih empty state perlu menghubungi admin/bem/dema, dan perketat rbac