# Restoran Berkah (Firebase POS App) 🚀

Aplikasi Sistem Point of Sale (POS) lengkap berbasis React Native (Expo) dan Firebase (Firestore NoSQL). Aplikasi ini sudah disempurnakan menjadi Sistem Manajemen Restoran penuh dengan fitur-fitur profesional.

## 🌟 Fitur Utama

1. **Autentikasi Multi-Role (RBAC)**
   - Akses tab / layar dibatasi sesuai dengan tipe akun yang login.
   - Tidak perlu registrasi panjang, terdapat 3 Role utama (Admin, Kasir, Dapur).

2. **Alur Fast-Food & Checkout Cerdas**
   - Kasir dapat memilih *Tipe Pesanan* (**Dine-in** atau **Take-away**).
   - Terdapat kolom **Nomor Meja** (Wajib isi jika Dine-in).
   - Fitur **Diskon/Potongan Harga** pada setiap transaksi.
   - Status pesanan baru otomatis menjadi `"dimasak"`.

3. **Kitchen Display System (KDS) / Layar Dapur**
   - Tab khusus untuk koki/orang dapur melihat pesanan yang masuk.
   - Hanya pesanan berstatus `"dimasak"` yang akan tampil di sini.
   - Terdapat tombol **"Siap Disajikan"** yang akan otomatis mengubah status pesanan menjadi `"selesai"`.

4. **Cetak Struk Thermal Kasir (Print/PDF)**
   - Transaksi selesai akan tersimpan di halaman *Laporan*.
   - Tombol **Cetak Struk** akan membuka lembar tagihan dengan gaya *Kertas Thermal POS 58/80mm*.
   - Rincian struk lengkap termasuk logo, PPN 10%, diskon, tipe pesanan, nomor meja, dll.
   - Struk bisa dikirim ke printer kasir bluetooth atau disimpan sebagai PDF.

5. **Analisis Grafik (Chart) Pendapatan**
   - Halaman *Dashboard* menampilkan Bar Chart grafik penjualan selama **7 hari terakhir** secara otomatis dari Firestore.
   - Ringkasan statistik (Pendapatan Hari Ini, Total Transaksi, Jumlah Menu Aktif).

6. **Gambar Dinamis Berbasis Galeri (Base64)**
   - Bisa menambahkan foto makanan/minuman dengan upload langsung dari Galeri (menggunakan encoding Base64) tanpa perlu Firebase Storage berbayar.

## 👤 Akun Demo Bawaan
Silakan gunakan akun berikut saat berada di halaman Login:

| Role | Username | Password | Hak Akses Tab |
|------|----------|----------|---------------|
| **Admin** | `admin` | `123` | Semua fitur terbuka (Menu, Kasir, Dapur, Dashboard, Laporan) |
| **Kasir** | `kasir` | `123` | Hanya layar **Kasir** dan **Laporan** |
| **Dapur** | `dapur` | `123` | Hanya layar **Dapur** saja |

## 🛠️ Cara Menjalankan Project

1. **Install Dependencies**
   ```bash
   npm install
   ```
2. **Jalankan Aplikasi Expo**
   ```bash
   npm run start
   # atau
   npx expo start
   ```
3. Tekan `a` untuk membuka di Android Emulator, atau `w` untuk membuka di Browser Web.

## 🗄️ Database & Teknologi
* **Framework:** React Native dengan [Expo Router](https://docs.expo.dev/router/introduction/)
* **Database:** Firebase Cloud Firestore (NoSQL)
* **Charts:** `react-native-chart-kit`
* **Printing:** `expo-print`, `expo-sharing`
* **Image Picker:** `expo-image-picker`

---
*Dibuat untuk mempermudah manajemen restoran skala kecil menengah.*
