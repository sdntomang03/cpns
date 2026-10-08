<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class MaterialsSeeder extends Seeder
{
    public function run(): void
    {
        $materials = [
            'twk' => [
                [
                    'title' => 'Pancasila sebagai Dasar Negara',
                    'slug' => 'pancasila',
                    'content' => <<<'HTML'
<h2>Pancasila sebagai Dasar Negara</h2>
<p>Pancasila adalah dasar negara, ideologi nasional, dan pandangan hidup bangsa Indonesia. Lima silanya merupakan satu kesatuan nilai yang saling menjiwai, bukan prinsip yang berdiri sendiri.</p>
<ol>
  <li><strong>Ketuhanan Yang Maha Esa:</strong> menjamin kebebasan beragama dan menghormati keyakinan orang lain.</li>
  <li><strong>Kemanusiaan yang adil dan beradab:</strong> mengakui martabat manusia dan menolak perlakuan diskriminatif.</li>
  <li><strong>Persatuan Indonesia:</strong> menjaga kesatuan dengan tetap menghargai keberagaman.</li>
  <li><strong>Kerakyatan:</strong> mengutamakan musyawarah dan perwakilan dalam pengambilan keputusan.</li>
  <li><strong>Keadilan sosial:</strong> mendorong kesempatan dan kesejahteraan yang adil bagi seluruh rakyat.</li>
</ol>
<h3>Penerapan dalam kehidupan bernegara</h3>
<p>Kebijakan publik yang baik menggabungkan nilai kemanusiaan, persatuan, musyawarah, dan keadilan. Aparatur negara perlu memberikan layanan tanpa membedakan suku, agama, kondisi ekonomi, atau pilihan politik warga.</p>
<h3>Contoh soal</h3>
<p>Dalam rapat pelayanan desa, warga berbeda pendapat tentang prioritas anggaran. Sikap yang paling sesuai dengan Pancasila adalah mendengarkan aspirasi secara setara, bermusyawarah, dan memilih keputusan yang mengutamakan kepentingan bersama.</p>
HTML,
                ],
                [
                    'title' => 'UUD Negara Republik Indonesia Tahun 1945',
                    'slug' => 'uud-1945',
                    'content' => <<<'HTML'
<h2>UUD Negara Republik Indonesia Tahun 1945</h2>
<p>Undang-Undang Dasar Negara Republik Indonesia Tahun 1945 adalah hukum dasar tertulis. Pembukaannya memuat tujuan negara, dasar negara, dan cita-cita kemerdekaan.</p>
<h3>Pokok penting untuk dipahami</h3>
<ul>
  <li>Pembukaan UUD 1945 terdiri atas empat alinea; alinea keempat memuat tujuan negara dan rumusan Pancasila.</li>
  <li>Indonesia adalah negara kesatuan yang berbentuk republik.</li>
  <li>Kedaulatan berada di tangan rakyat dan dilaksanakan menurut UUD.</li>
  <li>Setiap warga negara memiliki hak dan kewajiban yang diatur dalam konstitusi.</li>
  <li>Kekuasaan negara dibagi dan dijalankan oleh lembaga negara sesuai kewenangannya.</li>
</ul>
<h3>Contoh penerapan</h3>
<p>Ketika memberi layanan administrasi, petugas wajib mengikuti aturan yang berlaku dan memperlakukan warga dengan setara. Kewenangan pelayanan tidak boleh dipakai untuk menghalangi hak warga atau meminta imbalan di luar ketentuan.</p>
HTML,
                ],
                [
                    'title' => 'Negara Kesatuan Republik Indonesia',
                    'slug' => 'negara-kesatuan-republik-indonesia',
                    'content' => <<<'HTML'
<h2>Negara Kesatuan Republik Indonesia</h2>
<p>Indonesia adalah negara kepulauan yang wilayahnya membentang dari Sabang sampai Merauke. Bentuk negara kesatuan menempatkan Indonesia sebagai satu negara berdaulat dengan pemerintahan nasional dan daerah yang bekerja dalam kerangka NKRI.</p>
<h3>Menjaga keutuhan NKRI</h3>
<ul>
  <li>Mematuhi hukum dan menyelesaikan perbedaan melalui cara yang damai.</li>
  <li>Mengutamakan kepentingan bangsa di atas kepentingan golongan.</li>
  <li>Menolak provokasi, kekerasan, dan penyebaran informasi yang memecah belah.</li>
  <li>Menghormati keragaman bahasa, adat, agama, dan budaya di seluruh wilayah.</li>
</ul>
<p>Otonomi daerah memberi ruang bagi daerah mengatur urusan pemerintahan tertentu sesuai peraturan perundang-undangan, tetapi tidak mengubah bentuk negara kesatuan.</p>
HTML,
                ],
                [
                    'title' => 'Bhinneka Tunggal Ika dan Toleransi',
                    'slug' => 'bhinneka-tunggal-ika',
                    'content' => <<<'HTML'
<h2>Bhinneka Tunggal Ika</h2>
<p>Bhinneka Tunggal Ika berarti berbeda-beda tetapi tetap satu. Semboyan ini mengajarkan bahwa persatuan Indonesia dibangun dengan menerima perbedaan, bukan menghapus identitas kelompok.</p>
<h3>Sikap yang mencerminkan kebinekaan</h3>
<ul>
  <li>Menghargai pelaksanaan ibadah dan perayaan budaya kelompok lain.</li>
  <li>Menggunakan bahasa yang santun dan tidak menyebarkan ujaran kebencian.</li>
  <li>Bekerja sama berdasarkan tujuan bersama, bukan kesamaan latar belakang.</li>
  <li>Memeriksa kebenaran informasi sebelum membagikannya.</li>
</ul>
<p>Dalam situasi kerja, perbedaan pendapat sebaiknya diselesaikan dengan dialog dan aturan yang adil. Kesetaraan tidak berarti semua orang harus memiliki pendapat yang sama.</p>
HTML,
                ],
                [
                    'title' => 'Sejarah Perumusan Pancasila',
                    'slug' => 'sejarah-perumusan-pancasila',
                    'content' => <<<'HTML'
<h2>Sejarah Perumusan Pancasila</h2>
<p>Perumusan dasar negara berlangsung melalui rangkaian pembahasan menjelang kemerdekaan Indonesia. Badan Penyelidik Usaha-Usaha Persiapan Kemerdekaan Indonesia (BPUPKI) membahas dasar negara dalam sidang tahun 1945. Gagasan dari para tokoh kemudian dibahas dan disepakati melalui proses kebangsaan.</p>
<p>Panitia Sembilan merumuskan Piagam Jakarta pada 22 Juni 1945. Setelah Proklamasi Kemerdekaan, Panitia Persiapan Kemerdekaan Indonesia (PPKI) mengesahkan UUD 1945 pada 18 Agustus 1945. Rumusan Pancasila tercantum dalam Pembukaan UUD 1945.</p>
<h3>Nilai keteladanan</h3>
<p>Proses tersebut menunjukkan bahwa para pendiri bangsa mengutamakan persatuan, dialog, dan kesediaan mencari rumusan yang dapat diterima seluruh rakyat Indonesia.</p>
HTML,
                ],
                [
                    'title' => 'Nasionalisme dan Bela Negara',
                    'slug' => 'nasionalisme-dan-bela-negara',
                    'content' => <<<'HTML'
<h2>Nasionalisme dan Bela Negara</h2>
<p>Nasionalisme adalah rasa cinta dan tanggung jawab terhadap bangsa yang diwujudkan dengan menjaga persatuan, menaati hukum, dan berkontribusi bagi kepentingan bersama. Nasionalisme yang sehat tidak merendahkan bangsa lain.</p>
<p>Bela negara merupakan hak dan kewajiban warga negara. Dalam kehidupan sehari-hari, wujudnya antara lain menjalankan tugas dengan disiplin, menjaga fasilitas umum, membantu masyarakat, serta menggunakan ruang digital secara bertanggung jawab.</p>
<h3>Contoh untuk aparatur</h3>
<p>Memberikan layanan yang cepat dan adil, menjaga kerahasiaan data warga, serta menolak gratifikasi adalah bentuk kontribusi nyata untuk memperkuat kepercayaan masyarakat kepada negara.</p>
HTML,
                ],
            ],
            'tiu' => [
                [
                    'title' => 'Aritmetika dan Operasi Bilangan',
                    'slug' => 'aritmetika-dasar',
                    'content' => <<<'HTML'
<h2>Aritmetika dan Operasi Bilangan</h2>
<p>Soal aritmetika menguji ketepatan operasi bilangan, pecahan, desimal, rasio, dan persentase. Kerjakan operasi dalam urutan yang benar: tanda kurung, pangkat/akar, perkalian/pembagian, lalu penjumlahan/pengurangan.</p>
<h3>Persentase</h3>
<p>Persentase berarti per seratus. Nilai $p\%$ dari $N$ dapat dihitung dengan:</p>
<p>$$\text{nilai} = \frac{p}{100} \times N$$</p>
<p>Contoh: $20\%$ dari $250$ adalah $\frac{20}{100}\times 250 = 50$.</p>
<h3>Persamaan sederhana</h3>
<p>Untuk menyelesaikan $2x + 5 = 15$, kurangi kedua ruas dengan $5$, kemudian bagi dengan $2$:</p>
<p>$$2x = 10 \quad\Rightarrow\quad x = 5$$</p>
<h3>Strategi</h3>
<p>Ubah soal cerita menjadi hubungan antarbesaran, tulis satuan, dan periksa kembali apakah hasilnya masuk akal.</p>
HTML,
                ],
                [
                    'title' => 'Deret Angka dan Pola',
                    'slug' => 'deret-angka',
                    'content' => <<<'HTML'
<h2>Deret Angka dan Pola</h2>
<p>Deret angka meminta kita menemukan aturan yang menghubungkan satu suku dengan suku berikutnya. Periksa selisih, rasio, pola bergantian, dan operasi pada posisi ganjil-genap.</p>
<h3>Pola selisih tetap</h3>
<p>Pada deret $4, 7, 10, 13, \ldots$, selisih setiap dua suku berurutan adalah $3$. Rumus suku ke-$n$ untuk barisan aritmetika:</p>
<p>$$U_n = a + (n-1)b$$</p>
<p>Dengan suku pertama $a=4$ dan beda $b=3$, suku ke-6 adalah $U_6=4+(6-1)\times3=19$.</p>
<h3>Pola perkalian</h3>
<p>Deret $3, 6, 12, 24, \ldots$ memiliki rasio $2$, sehingga suku berikutnya adalah $48$. Jangan langsung memilih pola sebelum menguji aturan pada semua suku.</p>
HTML,
                ],
                [
                    'title' => 'Perbandingan, Rasio, dan Skala',
                    'slug' => 'perbandingan-rasio-dan-skala',
                    'content' => <<<'HTML'
<h2>Perbandingan, Rasio, dan Skala</h2>
<p>Rasio membandingkan dua besaran sejenis. Rasio $a:b$ dapat disederhanakan dengan membagi kedua nilai oleh faktor persekutuan terbesarnya.</p>
<h3>Perbandingan senilai</h3>
<p>Jika semakin banyak pekerja menyelesaikan pekerjaan yang sama dalam waktu lebih singkat, hubungan jumlah pekerja dan waktu bersifat berbalik nilai. Untuk perbandingan senilai berlaku:</p>
<p>$$\frac{a_1}{b_1} = \frac{a_2}{b_2}$$</p>
<p>Contoh: 3 buku seharga Rp24.000. Dengan harga satuan yang sama, 5 buku berharga $\frac{5}{3}\times 24.000 = \text{Rp}40.000$.</p>
<h3>Skala</h3>
<p>Skala peta adalah perbandingan jarak pada peta terhadap jarak sebenarnya dengan satuan yang sama. Skala $1:100.000$ berarti setiap 1 cm pada peta mewakili 100.000 cm atau 1 km di lapangan.</p>
HTML,
                ],
                [
                    'title' => 'Kecepatan, Jarak, dan Waktu',
                    'slug' => 'kecepatan-jarak-waktu',
                    'content' => <<<'HTML'
<h2>Kecepatan, Jarak, dan Waktu</h2>
<p>Hubungan dasar gerak dinyatakan dengan rumus:</p>
<p>$$v = \frac{s}{t}, \qquad s = v \times t, \qquad t = \frac{s}{v}$$</p>
<p>Dengan $v$ sebagai kecepatan, $s$ jarak, dan $t$ waktu. Samakan satuan sebelum menghitung. Konversi yang sering dipakai adalah $1\ \text{m/s} = 3{,}6\ \text{km/jam}$.</p>
<h3>Contoh</h3>
<p>Kendaraan melaju 60 km/jam selama 2,5 jam. Jarak yang ditempuh adalah $s=60\times2{,}5=150$ km.</p>
<p>Jika dua kendaraan bergerak saling mendekat, kecepatan relatifnya dijumlahkan. Jika bergerak searah, kurangkan kecepatannya untuk mencari kecepatan relatif.</p>
HTML,
                ],
                [
                    'title' => 'Geometri dan Bangun Datar',
                    'slug' => 'geometri-bangun-datar',
                    'content' => <<<'HTML'
<h2>Geometri dan Bangun Datar</h2>
<p>Kenali unsur bangun, gunakan satuan yang konsisten, dan perhatikan apakah soal menanyakan keliling atau luas.</p>
<ul>
  <li>Persegi: keliling $K=4s$, luas $L=s^2$.</li>
  <li>Persegi panjang: keliling $K=2(p+l)$, luas $L=p\times l$.</li>
  <li>Segitiga: luas $L=\frac{1}{2}at$.</li>
  <li>Lingkaran: keliling $K=2\pi r$, luas $L=\pi r^2$.</li>
</ul>
<h3>Teorema Pythagoras</h3>
<p>Pada segitiga siku-siku dengan sisi tegak $a$, sisi alas $b$, dan hipotenusa $c$:</p>
<p>$$a^2+b^2=c^2$$</p>
<p>Contoh: jika $a=3$ dan $b=4$, maka $c=\sqrt{3^2+4^2}=5$.</p>
HTML,
                ],
                [
                    'title' => 'Verbal: Sinonim, Antonim, dan Analogi',
                    'slug' => 'verbal-sinonim-antonim-analogi',
                    'content' => <<<'HTML'
<h2>Verbal: Sinonim, Antonim, dan Analogi</h2>
<p>Kemampuan verbal menguji pemahaman hubungan makna kata, ketepatan memilih padanan, dan kemampuan menarik hubungan antarkonsep.</p>
<ul>
  <li><strong>Sinonim:</strong> kata yang memiliki makna sama atau hampir sama. Perhatikan konteks pemakaiannya.</li>
  <li><strong>Antonim:</strong> kata yang memiliki makna berlawanan dalam konteks tertentu.</li>
  <li><strong>Analogi:</strong> identifikasi hubungan pasangan pertama, lalu cari pasangan kedua dengan hubungan yang sepadan.</li>
</ul>
<h3>Strategi analogi</h3>
<p>Contoh pola: dokter : pasien = guru : murid. Hubungannya adalah profesi yang memberikan layanan kepada penerima layanan. Jangan hanya memilih kata yang topiknya mirip; pastikan hubungan logisnya setara.</p>
HTML,
                ],
            ],
            'tkp' => [
                [
                    'title' => 'Pelayanan Publik yang Responsif',
                    'slug' => 'pelayanan-publik',
                    'content' => <<<'HTML'
<h2>Pelayanan Publik yang Responsif</h2>
<p>Pelayanan publik berorientasi pada kebutuhan masyarakat, dilaksanakan secara adil, transparan, dan sesuai standar. Petugas perlu mendengarkan kebutuhan warga tanpa menjanjikan hal yang berada di luar kewenangannya.</p>
<h3>Langkah menghadapi keluhan</h3>
<ol>
  <li>Dengarkan warga dengan tenang dan klarifikasi inti masalah.</li>
  <li>Periksa ketentuan dan data yang relevan.</li>
  <li>Jelaskan solusi serta perkiraan waktu dengan bahasa yang mudah dipahami.</li>
  <li>Catat dan tindak lanjuti keluhan melalui prosedur yang tersedia.</li>
</ol>
<p>Dalam soal situasional, pilih tindakan yang empatik, proaktif, tidak diskriminatif, dan tetap mematuhi aturan.</p>
HTML,
                ],
                [
                    'title' => 'Jejaring Kerja dan Kolaborasi',
                    'slug' => 'jejaring-kerja-dan-kolaborasi',
                    'content' => <<<'HTML'
<h2>Jejaring Kerja dan Kolaborasi</h2>
<p>Kolaborasi adalah upaya mencapai tujuan bersama dengan berbagi informasi, menghargai keahlian rekan, dan menepati tanggung jawab masing-masing. Jejaring kerja yang baik dibangun melalui komunikasi profesional dan saling percaya.</p>
<h3>Ketika terjadi perbedaan pendapat</h3>
<ul>
  <li>Fokus pada tujuan dan data, bukan menyerang pribadi.</li>
  <li>Berikan kesempatan semua pihak menyampaikan pandangan.</li>
  <li>Sepakati pembagian tugas, tenggat, dan cara memantau hasil.</li>
  <li>Eskalasi kepada atasan bila masalah tidak dapat diselesaikan sesuai kewenangan.</li>
</ul>
HTML,
                ],
                [
                    'title' => 'Sosial Budaya dan Kepekaan',
                    'slug' => 'sosial-budaya-dan-kepekaan',
                    'content' => <<<'HTML'
<h2>Sosial Budaya dan Kepekaan</h2>
<p>Kepekaan sosial berarti memahami kondisi dan sudut pandang orang lain, termasuk perbedaan budaya, usia, kemampuan, dan akses terhadap layanan. Sikap ini tidak mengurangi standar pelayanan; justru membantu layanan disampaikan secara setara.</p>
<h3>Penerapan</h3>
<ul>
  <li>Gunakan bahasa yang sopan dan tidak merendahkan.</li>
  <li>Pastikan informasi dapat dipahami oleh warga dengan kebutuhan berbeda.</li>
  <li>Hindari prasangka ketika melayani kelompok tertentu.</li>
  <li>Berikan bantuan akses sesuai prosedur dan kebutuhan nyata.</li>
</ul>
HTML,
                ],
                [
                    'title' => 'Teknologi Informasi dan Keamanan Data',
                    'slug' => 'teknologi-informasi-dan-keamanan-data',
                    'content' => <<<'HTML'
<h2>Teknologi Informasi dan Keamanan Data</h2>
<p>Aparatur menggunakan teknologi untuk membuat pekerjaan lebih efektif, sambil menjaga kerahasiaan, keutuhan, dan ketersediaan informasi. Data pribadi warga hanya boleh diakses dan digunakan sesuai tugas serta dasar yang sah.</p>
<h3>Kebiasaan aman</h3>
<ul>
  <li>Gunakan kata sandi yang kuat dan jangan membagikan kode verifikasi.</li>
  <li>Periksa penerima sebelum mengirim dokumen yang memuat data pribadi.</li>
  <li>Waspadai tautan dan lampiran yang tidak dikenal.</li>
  <li>Laporkan insiden atau salah kirim data melalui prosedur yang berlaku.</li>
</ul>
<p>Jangan menggunakan perangkat atau akun orang lain untuk mengakses data tanpa izin, sekalipun alasannya mempercepat pekerjaan.</p>
HTML,
                ],
                [
                    'title' => 'Profesionalisme dan Tanggung Jawab',
                    'slug' => 'profesionalisme-dan-tanggung-jawab',
                    'content' => <<<'HTML'
<h2>Profesionalisme dan Tanggung Jawab</h2>
<p>Profesionalisme mencakup kompetensi, disiplin, kualitas hasil, dan tanggung jawab terhadap dampak pekerjaan. Pegawai profesional terbuka terhadap umpan balik dan terus memperbarui pengetahuan.</p>
<h3>Mengelola tugas</h3>
<ol>
  <li>Tentukan prioritas berdasarkan urgensi, dampak, dan tenggat.</li>
  <li>Pastikan instruksi dan standar hasil dipahami.</li>
  <li>Berkomunikasi lebih awal jika ada risiko keterlambatan.</li>
  <li>Periksa hasil sebelum diserahkan dan dokumentasikan pekerjaan.</li>
</ol>
<p>Jika menerima tugas di luar kompetensi atau kewenangan, sampaikan keterbatasan dengan jujur dan minta arahan atau dukungan yang diperlukan.</p>
HTML,
                ],
                [
                    'title' => 'Integritas dan Etika Aparatur',
                    'slug' => 'integritas',
                    'content' => <<<'HTML'
<h2>Integritas dan Etika Aparatur</h2>
<p>Integritas berarti konsisten antara nilai, perkataan, dan tindakan, termasuk ketika tidak ada pengawasan. Aparatur berintegritas bekerja jujur, bertanggung jawab, objektif, dan mematuhi ketentuan.</p>
<h3>Prinsip dalam pekerjaan</h3>
<ul>
  <li>Menolak hadiah atau fasilitas yang dapat memengaruhi keputusan.</li>
  <li>Mengungkapkan potensi konflik kepentingan dan meminta arahan atasan.</li>
  <li>Menjaga dokumen serta data pribadi warga.</li>
  <li>Mengakui kesalahan, memperbaikinya, dan melaporkannya melalui prosedur.</li>
</ul>
<p>Jika diminta mempercepat layanan dengan imbalan pribadi, tolak dengan sopan, jelaskan prosedur resmi, dan laporkan melalui kanal yang tersedia.</p>
HTML,
                ],
            ],
        ];

        foreach ($materials as $categorySlug => $items) {
            $category = Category::query()->updateOrCreate(
                ['slug' => $categorySlug],
                ['name' => strtoupper($categorySlug)],
            );

            foreach ($items as $order => $material) {
                $seededMaterial = $category->materials()->withTrashed()->updateOrCreate(
                    ['slug' => $material['slug']],
                    [
                        ...$material,
                        'order' => $order + 1,
                        'is_published' => true,
                    ],
                );

                if ($seededMaterial->trashed()) {
                    $seededMaterial->restore();
                }
            }
        }
    }
}
