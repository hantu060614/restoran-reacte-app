# Dokumentasi Aplikasi Restoran Berkah

## 1. Identitas Aplikasi

**Restoran Berkah** adalah aplikasi Point of Sale (POS) dan manajemen restoran berbasis mobile yang dibuat menggunakan React Native, Expo, dan Firebase Cloud Firestore. Aplikasi ini dirancang untuk membantu proses operasional restoran, mulai dari pengelolaan menu, transaksi kasir, monitoring pesanan di dapur, sampai pembuatan laporan penjualan.

Proyek ini dibuat sebagai aplikasi pembelajaran yang menunjukkan penerapan:

- Pengembangan aplikasi mobile lintas platform.
- Penggunaan Firebase sebagai database real-time.
- Pembagian hak akses pengguna berdasarkan role.
- Pengelolaan transaksi restoran secara digital.
- Pembuatan laporan dan struk transaksi.

## 2. Tujuan Pembuatan Aplikasi

Tujuan utama aplikasi ini adalah menyediakan sistem sederhana untuk membantu restoran skala kecil atau menengah dalam mengelola aktivitas penjualan secara lebih cepat, rapi, dan terdokumentasi.

Secara khusus, aplikasi ini bertujuan untuk:

- Memudahkan admin dalam mengelola data menu makanan dan minuman.
- Memudahkan kasir dalam mencatat pesanan pelanggan.
- Memudahkan bagian dapur dalam melihat daftar pesanan yang harus diproses.
- Menyediakan laporan transaksi berdasarkan periode tertentu.
- Menampilkan ringkasan pendapatan melalui dashboard dan grafik.

## 3. Teknologi Yang Digunakan

| Teknologi | Keterangan |
| --- | --- |
| React Native | Framework untuk membangun aplikasi mobile |
| Expo | Platform untuk menjalankan dan mengembangkan aplikasi React Native |
| Expo Router | Routing berbasis file untuk navigasi antar halaman |
| TypeScript | Bahasa pemrograman yang digunakan pada proyek |
| Firebase Firestore | Database NoSQL real-time untuk menyimpan menu dan transaksi |
| React Native Chart Kit | Library untuk menampilkan grafik pendapatan |
| Expo Image Picker | Library untuk memilih gambar menu dari galeri |
| Expo Print dan Expo Sharing | Library untuk membuat dan membagikan struk transaksi |

## 4. Fitur Aplikasi

### 4.1 Login Multi Role

Aplikasi memiliki sistem login sederhana berdasarkan tiga role pengguna:

| Role | Username | Password | Hak Akses |
| --- | --- | --- | --- |
| Admin | `admin` | `123` | Dashboard, menu, pemesanan, dapur, laporan |
| Kasir | `kasir` | `123` | Pemesanan dan laporan |
| Dapur | `dapur` | `123` | Dapur |

Setelah login, pengguna diarahkan ke halaman yang sesuai dengan role masing-masing.

### 4.2 Manajemen Menu

Halaman menu digunakan oleh admin untuk mengelola daftar makanan dan minuman. Fitur pada halaman ini meliputi:

- Menampilkan daftar menu dari Firestore secara real-time.
- Menambahkan menu baru.
- Mengubah data menu yang sudah ada.
- Menghapus menu.
- Mengatur kategori menu.
- Mengatur harga menu.
- Mengatur status ketersediaan menu.
- Menambahkan gambar menu dari galeri dalam format Base64.

Data menu disimpan pada collection Firestore bernama `tbmenu`.

### 4.3 Pemesanan dan Kasir

Halaman pemesanan digunakan untuk proses transaksi. Kasir dapat memilih menu, memasukkan item ke keranjang, dan melakukan checkout.

Fitur pada halaman pemesanan meliputi:

- Menampilkan menu yang tersedia.
- Filter menu berdasarkan kategori.
- Menambahkan item ke keranjang.
- Mengubah jumlah pesanan.
- Menghapus item dari keranjang.
- Memilih tipe pesanan, yaitu makan di tempat atau take away.
- Mengisi nomor meja untuk pesanan makan di tempat.
- Memasukkan diskon transaksi.
- Menghitung subtotal, diskon, PPN 10%, dan total pembayaran.
- Menyimpan transaksi ke Firestore.

Data transaksi disimpan pada collection Firestore bernama `tbpemesanan`.

### 4.4 Kitchen Display System

Halaman dapur digunakan oleh petugas dapur untuk melihat pesanan yang masuk. Pesanan yang baru dibuat oleh kasir akan memiliki status `dimasak`.

Fitur halaman dapur meliputi:

- Menampilkan pesanan yang sedang menunggu diproses.
- Menampilkan detail item pesanan.
- Menampilkan nomor meja jika pesanan makan di tempat.
- Mengubah status pesanan menjadi `selesai` melalui tombol "Siap Disajikan".

### 4.5 Dashboard

Dashboard digunakan untuk menampilkan ringkasan kondisi penjualan restoran. Informasi yang ditampilkan meliputi:

- Total pendapatan hari ini.
- Jumlah transaksi hari ini.
- Jumlah menu aktif.
- Grafik penjualan tujuh hari terakhir.
- Daftar transaksi terbaru.

Data dashboard diambil dari collection `tbpemesanan` dan `tbmenu`.

### 4.6 Laporan Transaksi

Halaman laporan digunakan untuk melihat riwayat transaksi. Fitur laporan meliputi:

- Menampilkan seluruh transaksi dari Firestore.
- Filter laporan berdasarkan hari ini, minggu ini, dan bulan ini.
- Menampilkan detail transaksi.
- Menampilkan total pendapatan sesuai filter.
- Membuka detail struk transaksi.
- Mencetak atau membagikan struk dalam format PDF.

## 5. Struktur Folder Proyek

Struktur folder utama pada proyek ini adalah sebagai berikut:

```text
restoran-reacte-app/
├── app/
│   ├── (tabs)/
│   │   ├── dashboard.tsx
│   │   ├── dapur.tsx
│   │   ├── laporan.tsx
│   │   ├── menu.tsx
│   │   └── pemesanan.tsx
│   ├── _layout.tsx
│   ├── index.tsx
│   ├── login.tsx
│   └── splash.tsx
├── components/
├── config/
│   └── firebase.ts
├── constants/
├── hooks/
├── package.json
└── README.md
```

Keterangan folder:

- `app/` berisi halaman utama aplikasi.
- `app/(tabs)/` berisi halaman yang tampil pada tab navigasi.
- `components/` berisi komponen UI pendukung.
- `config/firebase.ts` berisi konfigurasi koneksi Firebase.
- `constants/` berisi konfigurasi warna dan tema.
- `hooks/` berisi custom hook yang digunakan aplikasi.

## 6. Desain Database Firestore

Aplikasi menggunakan Firebase Cloud Firestore sebagai database utama.

### 6.1 Collection `tbmenu`

Collection ini digunakan untuk menyimpan data menu restoran.

Contoh struktur data:

```text
{
  kode: "M001",
  nama: "Nasi Goreng",
  kategori: "Makanan",
  harga: 15000,
  keterangan: "Menu nasi goreng spesial",
  imageUrl: "data:image/jpeg;base64,...",
  tersedia: true,
  createdAt: timestamp
}
```

### 6.2 Collection `tbpemesanan`

Collection ini digunakan untuk menyimpan data transaksi atau pesanan.

Contoh struktur data:

```text
{
  orderId: "ORD-123456",
  items: [
    {
      menuId: "id_menu",
      nama: "Nasi Goreng",
      harga: 15000,
      qty: 2,
      subtotal: 30000
    }
  ],
  subtotal: 30000,
  diskon: 0,
  pajak: 3000,
  total: 33000,
  metodePembayaran: "Tunai",
  tipePesanan: "Makan di Tempat",
  nomorMeja: "5",
  status: "dimasak",
  createdAt: timestamp
}
```

## 7. Alur Penggunaan Aplikasi

Alur penggunaan aplikasi secara umum adalah:

1. Pengguna membuka aplikasi.
2. Pengguna login menggunakan akun sesuai role.
3. Admin dapat menambahkan dan mengelola menu.
4. Kasir memilih menu dan membuat transaksi pesanan.
5. Pesanan masuk ke halaman dapur dengan status `dimasak`.
6. Petugas dapur menyelesaikan pesanan dengan tombol "Siap Disajikan".
7. Transaksi tersimpan dan dapat dilihat pada halaman laporan.
8. Admin dapat memantau pendapatan melalui dashboard.

## 8. Cara Menjalankan Aplikasi

Pastikan perangkat sudah memiliki Node.js dan npm.

### 8.1 Install Dependency

```bash
npm install
```

### 8.2 Menjalankan Aplikasi

```bash
npm run start
```

Setelah Expo berjalan, aplikasi dapat dibuka melalui:

- Android Emulator dengan menekan tombol `a`.
- Browser web dengan menekan tombol `w`.
- Aplikasi Expo Go pada perangkat mobile dengan scan QR code.

### 8.3 Perintah Tambahan

```bash
npm run android
npm run ios
npm run web
npm run lint
```

## 9. Konfigurasi Firebase

Konfigurasi Firebase terdapat pada file:

```text
config/firebase.ts
```

File tersebut menginisialisasi Firebase App dan Firestore. Aplikasi menggunakan `experimentalForceLongPolling` agar koneksi Firestore lebih stabil pada beberapa lingkungan jaringan.

## 10. Kelebihan Aplikasi

- Menggunakan database real-time sehingga data menu dan transaksi dapat langsung diperbarui.
- Memiliki pembagian hak akses berdasarkan role pengguna.
- Mendukung alur kerja restoran dari kasir sampai dapur.
- Menyediakan laporan transaksi dan struk pembayaran.
- Memiliki dashboard pendapatan dengan grafik tujuh hari terakhir.
- Dapat dijalankan pada Android, iOS, dan web melalui Expo.

## 11. Batasan Aplikasi

Aplikasi ini masih menggunakan login demo yang disimpan pada kode aplikasi. Pada pengembangan produksi, sistem login sebaiknya diganti menggunakan Firebase Authentication atau database user yang lebih aman.

Selain itu, gambar menu saat ini disimpan dalam format Base64 pada Firestore. Untuk penggunaan skala besar, penyimpanan gambar lebih disarankan menggunakan Firebase Storage agar ukuran database tetap efisien.

## 12. Kesimpulan

Aplikasi Restoran Berkah merupakan sistem POS restoran berbasis React Native dan Firebase yang mencakup fitur utama operasional restoran, yaitu manajemen menu, pemesanan, dapur, laporan, struk, dan dashboard. Aplikasi ini dapat menjadi contoh implementasi sistem informasi restoran sederhana yang berjalan secara real-time dan dapat dikembangkan lebih lanjut sesuai kebutuhan.
