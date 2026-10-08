# CPNS Nasional

Aplikasi latihan dan try out CPNS untuk Android dengan React/Capacitor sebagai
frontend dan Laravel REST API sebagai backend. Implementasi dikerjakan bertahap;
repo saat ini berisi fondasi Tahap 1-3: Laravel API, Sanctum, auth/profile,
frontend React/Capacitor, serta cache SQLite untuk materi offline.

## Arsitektur

```text
React + Capacitor (Android)
  UI / React Router / Zustand
  API client / SQLite / sync queue / offline cache
              | HTTPS /api/v1
Laravel API (Sanctum, Resources, Form Requests, Policies, Services)
              |
       MySQL (sumber kebenaran)
```

SQLite pada perangkat direncanakan untuk materi dan soal latihan offline,
progress, attempt latihan, jawaban lokal, dan antrean sync. Data try out
nasional, penilaian final, serta ranking selalu ditentukan server. Server
menjadi sumber kebenaran saat konflik sinkronisasi; attempt menggunakan UUID
agar pengiriman dapat dibuat idempoten.

### Skema data bertahap

Tahap 1 menyiapkan `users`, `profiles`, dan `personal_access_tokens`. Tahap 3
menambahkan `categories` dan `materials` (soft delete dan penanda publikasi
untuk sinkronisasi). Tahap berikutnya menambahkan `questions`,
`question_options`, `tryouts`, `tryout_sessions`, `tryout_questions`,
`attempts`, `attempt_answers`, `practice_sessions`, `practice_answers`,
`media`, `rankings`, dan `sync_logs` dengan foreign key dan index. Passing
grade dan bobot/nilai pilihan disimpan di server. Kunci jawaban try out tidak
dikirim ke klien sebelum submit.

### Struktur direktori rencana

```text
frontend/src/{api,components,pages,database,services,store,utils,routes}
backend/{app/Http/{Controllers/Api/V1,Requests,Resources},app/Models,
         app/Services,app/Policies,database/migrations,routes}
```

### Endpoint

Endpoint yang sudah tersedia:

| Method | Path | Akses |
| --- | --- | --- |
| POST | `/api/v1/auth/register` | Publik, throttled |
| POST | `/api/v1/auth/login` | Publik, throttled |
| POST | `/api/v1/auth/logout` | Sanctum |
| GET | `/api/v1/profile` | Sanctum |
| PUT | `/api/v1/profile` | Sanctum |
| GET | `/api/v1/news` | Sanctum, berita terbit |
| GET | `/api/v1/news/{slug}` | Sanctum, berita terbit |
| POST | `/api/v1/notifications/device` | Sanctum |
| DELETE | `/api/v1/notifications/device` | Sanctum |
| GET | `/api/v1/admin/news` | Admin |
| POST | `/api/v1/admin/news` | Admin |
| PUT | `/api/v1/admin/news/{id}` | Admin |
| DELETE | `/api/v1/admin/news/{id}` | Admin |
| POST | `/api/v1/admin/notifications/broadcast` | Admin, throttled |
| GET | `/api/v1/dashboard/summary` | Sanctum |
| GET | `/api/v1/ranking/national` | Sanctum |
| GET | `/api/v1/ranking/me` | Sanctum |
| GET | `/api/v1/materials` | Sanctum |
| GET | `/api/v1/materials/{id}` | Sanctum |
| GET | `/api/v1/practice/packages` | Sanctum |
| POST | `/api/v1/practice/packages/{id}/result` | Sanctum |
| POST | `/api/v1/practice/progress/sync` | Sanctum |
| GET | `/api/v1/tryouts` | Sanctum |
| POST | `/api/v1/tryouts/{id}/start` | Sanctum |
| POST | `/api/v1/tryout-attempts/{uuid}/answer` | Sanctum |
| POST | `/api/v1/tryout-attempts/{uuid}/submit` | Sanctum |
| GET | `/api/v1/tryout-attempts/{uuid}/result` | Sanctum |

Paket latihan contoh memiliki lima soal dengan bobot lima untuk TWK/TIU dan
bobot satu dengan nilai pilihan maksimum lima untuk TKP, sehingga nilai
maksimum setiap paket adalah 25. Batas lulus contoh disesuaikan di server
dengan skala paket latihan. Jalankan `php artisan migrate --seed` setelah
mengambil perubahan agar bobot dan data Try Out contoh diperbarui.

Try Out hanya tersedia online dan hanya dapat dikerjakan satu kali per peserta
untuk setiap paket. Sesi yang belum selesai dapat dilanjutkan dengan sisa waktu
dan jawaban yang sudah tersimpan; hasil yang sudah selesai dapat dilihat kembali
dari detail Try Out, tetapi tidak dapat diulang.
Server menyusun bagian TIU, TWK, dan TKP,
mengirim soal tanpa skor/kunci jawaban, menerima autosave tiap jawaban, lalu
menghitung serta menyimpan snapshot nilai dan pembahasan tiap bagian saat
submit. Nilai total dinyatakan berhasil hanya jika semua bagian mencapai passing grade. Seeder contoh
menggunakan daftar soal yang tersedia di paket latihan dan API menampilkan
jumlah aktual; isi bank contoh Try Out saat ini 10 soal per kategori, bukan
30/35/45 soal unik. Paket **TIU Paket Sinkronisasi Server** berisi lima soal
tambahan untuk menguji pembaruan paket dari server pada halaman Latihan.
Durasi total dikirim oleh API sebagai jumlah durasi bagian yang dikonfigurasi
di server. Saat peserta mulai, aplikasi menghitung mundur dengan waktu lokal
perangkat; ketika waktu habis, jawaban yang tersimpan otomatis dikirim untuk
dinilai. Tombol **Nomor soal** membuka modal berisi nomor soal berurutan lintas
seluruh bagian,
dengan penanda soal aktif, sudah dijawab, dan belum dijawab.

`GET /materials` menerima `category=twk|tiu|tkp`, `page`, `per_page` (maksimum
100), dan `updated_since` dalam format ISO-8601. Jika `updated_since` tidak
dikirim, hanya materi published yang dikembalikan. Mode incremental juga
mengirim tombstone materi terhapus/unpublished dengan `content: null`; aplikasi
menghapusnya dari cache lokal. Cursor `meta.server_time` dipakai sebagai
`updated_since` untuk sinkronisasi berikutnya.

Dashboard mengambil riwayat latihan dari SQLite perangkat, lalu menghitung
jumlah latihan, soal, benar, dan akurasi dari hasil yang benar-benar tersimpan.
Statistik Try Out serta ranking diambil dari server. Tombol **Sinkronkan data**
mengirim hasil latihan offline yang masih tertunda dan memuat ulang statistik
server. Pada halaman Latihan, **Perbarui** menampilkan daftar paket terbaru dari
server; tombol **Download** pada tiap paket menyimpannya secara terpisah ke
perangkat. Ranking nasional hanya menggunakan nilai Try Out terbaik tiap peserta.

Contoh request:

```http
GET /api/v1/materials?category=tiu&per_page=20&page=1
Authorization: Bearer <token>
Accept: application/json
```

```http
GET /api/v1/materials?updated_since=2026-10-07T10:00:00.000Z&per_page=100
Authorization: Bearer <token>
Accept: application/json
```

Koleksi dan environment Postman untuk endpoint yang tersedia ada di
[`postman/CPNS-Nasional.postman_collection.json`](./postman/CPNS-Nasional.postman_collection.json)
dan [`postman/CPNS-Nasional.local.postman_environment.json`](./postman/CPNS-Nasional.local.postman_environment.json).
Import keduanya ke Postman, pilih environment `CPNS Nasional - Local`, jalankan
register satu kali dengan email unik, lalu jalankan Login. Test script Login
menyimpan token ke environment dan collection variable; request profile dan
materi berikutnya otomatis menggunakan Bearer token.

### Alur penting

- **Authentication:** validasi Form Request → token Sanctum Bearer → token
  mobile disimpan di secure storage Capacitor (Tahap 2). `remember=false`
  menerbitkan token dengan masa berlaku satu hari; `remember=true` tanpa
  tanggal kedaluwarsa.
- **Offline sync:** ambil materi/soal yang berubah dari server → simpan di
  SQLite → tulis jawaban lokal sebelum mengantre pengiriman → kirim ulang
  operasi pending saat online. Data try out nasional tidak dapat dimulai
  offline.
- **Scoring:** server mengambil aturan sesi/opsi, menghitung nilai pilihan
  dikali bobot, menguji passing grade tiap sesi, lalu mengembalikan hasil dan
  analisis. TWK/TIU/TKP dikonfigurasi di backend, bukan di-hardcode di UI.
- **Try out:** online start → simpan jawaban lokal untuk pemulihan dan kirim
  autosave ke server → server menutup attempt dan menghitung nilai saat submit
  → tampilkan status per sesi dan hasil.

## Tahap 2: React + Capacitor + Navigation + Auth + Dashboard

### Prasyarat frontend

```powershell
cd frontend
Copy-Item .env.example .env
npm install
```

Konfigurasi API ditulis kebelakang pada `VITE_API_URL`. Contoh:

```dotenv
VITE_API_URL=http://127.0.0.1:8012/api/v1
```

### Berita, data pendaftaran, dan notifikasi

Form registrasi dan halaman Profil menyimpan `institution` (instansi yang
dituju) serta `target_position` (jabatan yang dituju). Keduanya juga dapat
diperbarui melalui `PUT /api/v1/profile`.

Menu **Berita** mengambil daftar dan detail dari `GET /api/v1/news` dan
`GET /api/v1/news/{slug}`. Admin dapat mengelola draft dan menerbitkan berita
melalui endpoint `/api/v1/admin/news`. Akun admin harus dipromosikan secara
manual oleh pengelola tepercaya pada database; tidak ada registrasi admin
publik. Body berita disajikan sebagai teks biasa,
ringkasan dan gambar bersifat opsional. Admin dapat mengirim `image` berupa URL
gambar atau berkas JPG, PNG, maupun WebP maksimal 5 MB menggunakan
`multipart/form-data`. Berkas diunggah ke disk `public` dengan URL yang dapat
diakses aplikasi; pada server lokal jalankan `php artisan storage:link`.
Untuk memperbarui berita dengan unggahan berkas, kirim `POST` ke endpoint
`/api/v1/admin/news/{id}` dengan field `_method=PUT` beserta field berita.
Jalankan `php artisan db:seed
--class=NewsSeeder` untuk memuat berita contoh.

Pendaftaran push aktif di aplikasi native Capacitor Android/iOS setelah
pengguna menyetujui izin notifikasi. Token perangkat didaftarkan ke API dan
admin dapat mengirim broadcast ke semua perangkat terdaftar:

```http
POST /api/v1/admin/notifications/broadcast
Authorization: Bearer <token-admin>
Content-Type: application/json

{
  "title": "Informasi CPNS",
  "body": "Berita terbaru sudah tersedia.",
  "url": "/news/persiapan-seleksi-cpns"
}
```

Respons berisi jumlah notifikasi yang terkirim dan gagal. Untuk mengaktifkan
FCM, buat Firebase project, tambahkan Android app dengan package
`com.cpnsnasionals.app`, lalu salin `google-services.json` ke
`frontend/android/app/google-services.json` dan jalankan
`npm run android:sync`. Simpan service account Firebase Admin SDK di
`backend/storage/app/firebase/service-account.json` (sudah diabaikan Git) dan
isi `FIREBASE_PROJECT_ID` serta `FIREBASE_CREDENTIALS` pada `backend/.env`.
Jangan commit file service account. Tanpa kredensial Firebase, API broadcast
mengembalikan HTTP 503 dengan pesan konfigurasi yang jelas.

Jalankan development server:

```powershell
npm run dev
```

Untuk Android / Capacitor:

```powershell
npm run android:sync
npm run android:open
```

Struktur frontend dibuat sesuai tahap 2 dengan routing, autentikasi, splash,
layout mobile, bottom navigation, dashboard, serta shell aplikasi Android.

## Tahap 3: SQLite + Materi Offline + Sync

Frontend memakai `@capacitor-community/sqlite` dengan `jeep-sqlite` sebagai
adapter browser. Materi diunduh dan ditulis ke SQLite lokal sebelum ditampilkan;
ketika offline, halaman materi membaca cache lokal dan menampilkan indikator
koneksi. Sinkronisasi incremental menghapus materi lokal saat server mengirim
tombstone. HTML materi disanitasi sebelum dirender. KaTeX dibundel di aplikasi
sehingga formula `$...$`, `$$...$$`, `\\(...\\)`, dan `\\[...\\]` dirender dari
data API maupun SQLite, termasuk saat offline.
Materi dibuka sebagai halaman tersendiri; tombol kembali membawa pengguna ke
daftar untuk memilih materi lain. Ikon awan menandai materi dari server, ikon
ponsel menandai salinan yang tersimpan di perangkat.

Seeder menyediakan 18 materi pengantar TWK, TIU, dan TKP, termasuk materi
aritmetika, deret, rasio, kecepatan, dan geometri dengan contoh rumus LaTeX.
Materi ini merupakan konten pembelajaran awal dan dapat diperluas atau
diperbarui melalui backend.

### Paket latihan TWK, TIU, dan TKP

Seeder membuat dua paket untuk setiap jenis tes. Jumlah soal mengikuti paket,
bukan pilihan pengguna. Nilai lulus disimpan di server: TWK 65, TIU 80, dan
TKP 166. Setiap soal mempunyai bobot; nilai pilihan jawaban TKP juga disimpan
di server dan dikalikan dengan bobot soal. Nilai online dihitung Laravel.
Paket yang diunduh disimpan di SQLite, sehingga latihan dan perhitungan hasil
tetap tersedia tanpa internet. Karena latihan offline perlu memeriksa hasil,
paket latihan tersimpan beserta aturan nilai dan kunci jawabannya; hal ini
khusus untuk latihan, bukan try out nasional.
Daftar menggabungkan paket server dan perangkat berdasarkan slug paket, dengan
versi tersimpan sebagai pilihan utama, sehingga paket yang sama tidak muncul
dua kali. Filter daftar dapat menampilkan semua paket, yang baru dari server,
atau yang tersimpan di perangkat.

Endpoint latihan (gunakan token Sanctum pada header `Authorization: Bearer
<token>`):

```http
GET /api/v1/practice/packages
POST /api/v1/practice/packages/{id}/result
Content-Type: application/json

{
  "answers": [
    { "question_id": 1, "option_id": 2 }
  ]
}
```

Result menerima satu pilihan untuk setiap soal dalam paket dan menghasilkan
`score`, `max_score`, `passing_score`, `passed`, serta pembahasan. Bobot,
ambang tuntas, dan nilai pilihan diperoleh dari backend, bukan dari formulir
jumlah soal di aplikasi. Jalankan `php artisan migrate --seed` untuk membuat
paket contoh.
Penyelesaian latihan mengizinkan soal kosong; soal tersebut bernilai nol dan
dilaporkan terpisah dari jawaban salah. Hasil akhir menampilkan jumlah benar,
salah, kosong, total skor, status lulus, dan grafik ringkasan. Semua hasil
langsung disimpan di SQLite dan disinkronkan saat tersedia koneksi.

Sinkron progres menggunakan `POST /api/v1/practice/progress/sync` dengan
`{ "attempts": [...] }`. Server menyimpan catatan secara idempoten untuk
statistik pengguna. Hasil latihan **tidak** memengaruhi ranking; ranking
nasional tetap menggunakan nilai Try Out Nasional dari server.

Backend perlu dimigrasi dan materi contoh disemai:

```powershell
cd backend
php artisan migrate
php artisan db:seed --class=MaterialsSeeder
php artisan serve --host=0.0.0.0
```

Jalankan `php artisan serve --host=0.0.0.0` agar perangkat fisik di jaringan
yang sama dapat mengakses API. Ganti `VITE_API_URL` di `frontend/.env` dengan
alamat IP komputer pengembang, misalnya
`http://192.168.1.10:8000/api/v1`. Untuk produksi gunakan HTTPS.

Di browser, SQLite Web menyimpan databasenya menggunakan jeep-sqlite dan
IndexedDB. Pada Android, database memakai SQLite native. Sinkronisasi membaca
watermark server hanya setelah seluruh halaman berhasil dicache.

### Troubleshooting sinkronisasi

Jalankan backend CPNS pada port yang sama dengan `VITE_API_URL`, misalnya:

```powershell
cd backend
php artisan serve --host=0.0.0.0 --port=8012
```

Untuk browser di komputer pengembang, set `frontend/.env` menjadi
`VITE_API_URL=http://127.0.0.1:8012/api/v1`, lalu restart Vite agar env dibaca
ulang. Untuk Android Emulator gunakan `http://10.0.2.2:8012/api/v1`; untuk
perangkat fisik gunakan IP LAN komputer. Jangan gunakan `127.0.0.1` pada
perangkat fisik karena alamat itu menunjuk ke perangkat itu sendiri. Jika
halaman melaporkan route API tidak ditemukan, pastikan alamat tersebut menuju
folder proyek ini (`backend`), bukan server Laravel lain yang kebetulan aktif
pada port yang sama.

## Tahap 1: Laravel API

### Prasyarat

- PHP 8.3+
- Composer 2
- MySQL 8 (atau SQLite untuk pengembangan awal)

### Instalasi dan konfigurasi

```powershell
cd backend
Copy-Item .env.example .env
composer install
php artisan key:generate
```

Untuk MySQL, atur `.env`:

```dotenv
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=cpns_nasional
DB_USERNAME=root
DB_PASSWORD=
```

Untuk pengembangan lokal tanpa MySQL, Laravel dapat memakai SQLite dengan
`DB_CONNECTION=sqlite` dan `DB_DATABASE=database/database.sqlite`. Buat file
database tersebut sebelum migrasi bila belum ada.

Jalankan migrasi dan server:

```powershell
php artisan migrate
php artisan serve --port=8012
```

API tersedia pada `http://127.0.0.1:8012/api/v1`. Respons API mengikuti bentuk
`success`, `message`, `data`, dan `meta`; kesalahan validasi berstatus HTTP
422 dengan `success: false` dan objek `errors`.

### Contoh auth

```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "name": "Nama Peserta",
  "email": "peserta@example.com",
  "phone": "081234567890",
  "password": "Password123!",
  "password_confirmation": "Password123!",
  "province": "DKI Jakarta",
  "city": "Jakarta Selatan"
}
```

Gunakan token yang dikembalikan sebagai `Authorization: Bearer <token>` untuk
endpoint terautentikasi. Token plaintext hanya dikembalikan saat diterbitkan;
password tidak pernah disimpan di SQLite atau dikembalikan lewat API.

### Pengujian

```powershell
php artisan test
```

## Tahapan pengembangan

1. Laravel API, authentication, user, profile, database, Sanctum (**tersedia**).
2. React, Capacitor, navigasi, auth, dashboard.
3. SQLite, materi, offline mode, sync.
4. Question engine, LaTeX, image, latihan.
5. Try out, attempt, timer, autosave, submit.
6. Scoring, passing grade, hasil, analisis.
7. Ranking nasional/provinsi/kota.
8. Admin question management, kompresi dan upload gambar.
9. Offline sync, penanganan konflik, optimasi.
10. Build Android APK/AAB.

Setup frontend, build Android, deployment, dan detail sinkronisasi dilengkapi
bersamaan dengan implementasi tahap-tahap tersebut agar dokumentasi sesuai
dengan fitur yang benar-benar tersedia.
#   c p n s  
 