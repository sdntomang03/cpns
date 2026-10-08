<?php

namespace Database\Seeders;

use App\Models\PracticePackage;
use Illuminate\Database\Seeder;

class PracticePackagesSeeder extends Seeder
{
    public function run(): void
    {
        $questions = [
            'twk' => [
                ['Apa makna utama semboyan Bhinneka Tunggal Ika?', ['Berbeda-beda tetapi tetap satu', 'Semua daerah harus memiliki budaya sama', 'Kepentingan daerah di atas bangsa', 'Perbedaan harus dihindari', 'Persatuan hanya berlaku saat darurat'], 0, 'Semboyan ini menegaskan persatuan dalam keberagaman.'],
                ['Rumusan Pancasila tercantum dalam bagian UUD 1945 yang mana?', ['Batang tubuh', 'Aturan peralihan', 'Pembukaan alinea keempat', 'Penjelasan umum', 'Aturan tambahan'], 2, 'Rumusan Pancasila terdapat pada Pembukaan UUD 1945 alinea keempat.'],
                ['Sikap yang paling mencerminkan musyawarah adalah ...', ['Memaksakan pendapat ketua', 'Mengutamakan suara kelompok terbesar tanpa diskusi', 'Mendengarkan pendapat dan mencari kesepakatan', 'Menunda semua keputusan', 'Menyerahkan keputusan kepada pihak luar'], 2, 'Musyawarah mengutamakan dialog dan kepentingan bersama.'],
                ['Bentuk negara Indonesia menurut UUD 1945 adalah ...', ['Federasi', 'Kesatuan', 'Konfederasi', 'Monarki', 'Protektorat'], 1, 'UUD 1945 menetapkan Indonesia sebagai negara kesatuan berbentuk republik.'],
                ['Contoh bela negara dalam pekerjaan sehari-hari adalah ...', ['Mengutamakan kepentingan pribadi', 'Menyebarkan informasi yang belum diperiksa', 'Menolak semua perubahan', 'Bekerja disiplin dan menjaga fasilitas umum', 'Menghindari tanggung jawab bersama'], 3, 'Bela negara dapat dilakukan melalui kontribusi yang bertanggung jawab.'],
                ['Lembaga yang mengesahkan UUD 1945 pada 18 Agustus 1945 adalah ...', ['BPUPKI', 'PPKI', 'KNIP', 'DPR', 'MPR'], 1, 'PPKI mengesahkan UUD 1945 pada 18 Agustus 1945.'],
                ['Sikap yang tepat menghadapi perbedaan agama di lingkungan kerja adalah ...', ['Membatasi kerja sama', 'Menghormati ibadah dan tetap bekerja sama', 'Meminta rekan mengikuti keyakinan sendiri', 'Menghindari komunikasi', 'Membeda-bedakan pelayanan'], 1, 'Toleransi berarti menghormati keyakinan dan menjaga kerja sama.'],
                ['Kedaulatan menurut UUD 1945 berada di tangan ...', ['Presiden', 'MPR sepenuhnya', 'Rakyat dan dilaksanakan menurut UUD', 'Mahkamah Agung', 'Pemerintah daerah'], 2, 'Kedaulatan berada di tangan rakyat dan dilaksanakan menurut UUD.'],
                ['Tujuan negara Indonesia tercantum pada ...', ['Pembukaan UUD 1945 alinea keempat', 'Pasal 1 UUD 1945', 'Batang tubuh seluruhnya', 'Sumpah Pemuda', 'Proklamasi saja'], 0, 'Tujuan negara dirumuskan dalam Pembukaan UUD 1945 alinea keempat.'],
                ['Saat menerima berita yang berpotensi memecah belah, tindakan tepat adalah ...', ['Langsung membagikannya', 'Menambahkan opini pribadi', 'Memeriksa sumber sebelum menyebarkan', 'Mengirim ke semua grup', 'Menghapus konteks berita'], 2, 'Memeriksa kebenaran informasi membantu menjaga persatuan.'],
            ],
            'tiu' => [
                ['Jika $2x + 5 = 15$, nilai $x$ adalah ...', ['3', '4', '5', '6', '10'], 2, 'Kurangi 5 dari kedua ruas sehingga $2x=10$, maka $x=5$.'],
                ['20% dari 250 adalah ...', ['25', '40', '50', '60', '75'], 2, '$20/100 \\times 250 = 50$.'],
                ['Deret 3, 6, 12, 24, ... memiliki suku berikutnya ...', ['30', '36', '42', '48', '54'], 3, 'Setiap suku dikalikan 2, sehingga suku berikutnya 48.'],
                ['Perbandingan 2 : 3 setara dengan ...', ['4 : 5', '6 : 9', '8 : 9', '10 : 12', '12 : 15'], 1, 'Kedua bilangan dikalikan 3 menghasilkan 6 : 9.'],
                ['Sebuah kendaraan melaju 60 km/jam selama 2,5 jam. Jaraknya adalah ...', ['120 km', '135 km', '145 km', '150 km', '160 km'], 3, 'Jarak = kecepatan × waktu = 60 × 2,5 = 150 km.'],
                [
                    'Pilih gambar yang melanjutkan urutan arah panah.',
                    ['Arah panah', 'Arah panah', 'Arah panah', 'Arah panah', 'Bentuk berbeda'],
                    0,
                    'Arah panah berputar 90 derajat searah jarum jam: kanan, bawah, kiri, lalu atas.',
                    '/figural/arrow-sequence.svg',
                    [
                        '/figural/arrow-up.svg',
                        '/figural/arrow-right.svg',
                        '/figural/arrow-down.svg',
                        '/figural/arrow-left.svg',
                        '/figural/shape-circle.svg',
                    ],
                ],
                ['Jika 5 pekerja menyelesaikan tugas dalam 12 hari, berapa hari untuk 10 pekerja dengan kemampuan sama?', ['3', '5', '6', '10', '24'], 2, 'Jumlah pekerjaan tetap: 5 × 12 = 10 × 6.'],
                ['Luas persegi dengan sisi 9 cm adalah ...', ['18 cm²', '36 cm²', '72 cm²', '81 cm²', '90 cm²'], 3, 'Luas persegi adalah sisi kuadrat: $9^2=81$.'],
                ['Nilai $\\frac{3}{4}$ dari 80 adalah ...', ['40', '50', '60', '70', '75'], 2, '$3/4 \\times 80 = 60$.'],
                ['Semua arsip disimpan rapi. Dokumen X adalah arsip. Kesimpulannya ...', ['Dokumen X disimpan rapi', 'Dokumen X bukan arsip', 'Semua dokumen adalah arsip', 'Arsip tidak disimpan', 'Tidak dapat ditentukan'], 0, 'Dokumen X termasuk arsip, sehingga disimpan rapi.'],
            ],
            'tkp' => [
                ['Warga mengeluhkan layanan yang terlambat. Anda sebaiknya ...', ['Mendengarkan keluhan, memeriksa kendala, dan memberi tindak lanjut', 'Meminta warga datang lain hari tanpa penjelasan', 'Menyalahkan rekan kerja', 'Mengabaikan karena antrean panjang', 'Menjanjikan selesai tanpa memeriksa'], [5, 4, 2, 1, 3], 'Respons terbaik empatik, berdasarkan fakta, dan disertai tindak lanjut.'],
                ['Rekan meminta data pribadi warga untuk keperluan di luar tugas. Anda ...', ['Mengirim data agar pekerjaan cepat', 'Memastikan dasar kewenangan dan menjaga kerahasiaan data', 'Mengunggah data ke grup kerja umum', 'Memberi akses akun pribadi', 'Membiarkan rekan mengambil sendiri'], [2, 5, 1, 1, 3], 'Data pribadi hanya digunakan sesuai kewenangan dan kebutuhan tugas.'],
                ['Tim berbeda pendapat tentang cara menyelesaikan tugas. Anda ...', ['Memaksakan pilihan sendiri', 'Menghindari diskusi', 'Mengajak membandingkan pilihan berdasarkan data dan tujuan', 'Menyerahkan seluruhnya kepada atasan', 'Menyetujui tanpa memahami keputusan'], [2, 1, 5, 3, 2], 'Kolaborasi efektif membahas data, tujuan, dan peran secara terbuka.'],
                ['Anda menyadari telah melakukan kesalahan pada dokumen layanan. Anda ...', ['Menyembunyikan kesalahan', 'Segera mengoreksi dan melapor sesuai prosedur', 'Menunggu sampai ada yang mengetahui', 'Menghapus dokumen tanpa catatan', 'Menyalahkan sistem'], [1, 5, 2, 2, 1], 'Integritas ditunjukkan dengan mengakui, memperbaiki, dan melaporkan.'],
                ['Beberapa tugas datang bersamaan dengan tenggat dekat. Anda ...', ['Mengerjakan yang paling mudah saja', 'Menentukan prioritas dari urgensi dan dampak, lalu mengomunikasikan risiko', 'Menunda semuanya', 'Meminta rekan mengambil alih tanpa koordinasi', 'Menyelesaikan secara acak'], [2, 5, 3, 2, 1], 'Prioritas ditetapkan dengan mempertimbangkan urgensi, dampak, dan komunikasi.'],
                ['Masyarakat dengan kebutuhan akses khusus datang ke loket. Anda ...', ['Meminta mereka mencari bantuan sendiri', 'Memberikan bantuan yang sesuai prosedur dan kebutuhan', 'Mendahulukan semua urusan lain', 'Meminta mereka kembali dengan pendamping', 'Mengurangi informasi yang diberikan'], [1, 5, 3, 2, 1], 'Layanan setara dapat memerlukan penyesuaian akses yang wajar.'],
                ['Atasan meminta Anda mempercepat layanan dengan imbalan pribadi. Anda ...', ['Menerima karena perintah atasan', 'Menolak dengan sopan dan menggunakan kanal pelaporan resmi', 'Meminta bagian lebih besar', 'Membiarkan rekan menerima', 'Mengubah urutan antrean diam-diam'], [1, 5, 1, 2, 1], 'Gratifikasi ditolak dan dilaporkan melalui prosedur yang berlaku.'],
                ['Anda mendapat tugas baru yang belum dikuasai. Anda ...', ['Menolak tanpa mencoba', 'Mempelajari standar, meminta arahan, dan mengerjakan dengan tanggung jawab', 'Berpura-pura memahami', 'Menyerahkan tugas ke rekan', 'Menunggu instruksi rinci tanpa inisiatif'], [2, 5, 1, 2, 3], 'Sikap profesional mencakup belajar dan meminta dukungan yang tepat.'],
                ['Anda menemukan informasi keliru tersebar di grup kantor. Anda ...', ['Meneruskan agar semua tahu', 'Memeriksa sumber lalu menyampaikan klarifikasi dengan santun', 'Membalas dengan sindiran', 'Menghapus pesan orang lain', 'Membiarkan tanpa mengecek'], [1, 5, 2, 1, 2], 'Informasi perlu diverifikasi sebelum klarifikasi disampaikan.'],
                ['Sistem layanan digital mengalami gangguan saat antrean ramai. Anda ...', ['Menghentikan layanan tanpa penjelasan', 'Memberi informasi jelas, menjalankan prosedur cadangan, dan melaporkan gangguan', 'Meminta warga mencoba terus', 'Menggunakan akun orang lain', 'Menyalahkan penyedia sistem'], [1, 5, 3, 1, 2], 'Informasi transparan dan prosedur cadangan menjaga mutu layanan.'],
            ],
        ];

        $passingScores = ['twk' => 11, 'tiu' => 12, 'tkp' => 19];
        $questionWeights = ['twk' => 5, 'tiu' => 5, 'tkp' => 1];

        foreach ($questions as $category => $items) {
            foreach ([1, 2] as $packageNumber) {
                $slug = "{$category}-paket-{$packageNumber}";
                $package = PracticePackage::query()->updateOrCreate(
                    ['slug' => $slug],
                    [
                        'category' => $category,
                        'title' => strtoupper($category)." Paket {$packageNumber}",
                        'description' => 'Paket latihan '.$category.' dengan sistem nilai dan ketuntasan.',
                        'passing_score' => $passingScores[$category],
                        'is_published' => true,
                    ],
                );

                $package->questions()->delete();
                $selectedItems = array_slice($items, ($packageNumber - 1) * 5, 5);

                foreach ($selectedItems as $index => $item) {
                    [$prompt, $answers, $correct, $explanation, $questionImage, $optionImages] = array_pad($item, 6, null);
                    $question = $package->questions()->create([
                        'question' => $prompt,
                        'image' => $questionImage,
                        'explanation' => $explanation,
                        'weight' => $questionWeights[$category],
                        'order' => $index + 1,
                    ]);

                    foreach ($answers as $optionIndex => $answer) {
                        $isTkp = $category === 'tkp';
                        $score = $isTkp
                            ? $correct[$optionIndex]
                            : ((int) $optionIndex === $correct ? 1 : 0);

                        $question->options()->create([
                            'label' => chr(65 + $optionIndex),
                            'answer' => $answer,
                            'image' => $optionImages[$optionIndex] ?? null,
                            'score' => $score,
                            'is_correct' => $isTkp ? $score === max($correct) : (int) $optionIndex === $correct,
                            'order' => $optionIndex + 1,
                        ]);
                    }
                }
            }
        }
    }
}
