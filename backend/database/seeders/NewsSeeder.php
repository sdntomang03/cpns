<?php

namespace Database\Seeders;

use App\Models\News;
use Illuminate\Database\Seeder;

class NewsSeeder extends Seeder
{
    public function run(): void
    {
        foreach ([
            [
                'slug' => 'persiapan-seleksi-cpns',
                'title' => 'Persiapkan Diri Menghadapi Seleksi CPNS',
                'summary' => 'Susun jadwal belajar, pahami materi, dan berlatih secara konsisten.',
                'content' => 'Mulailah dengan memahami kisi-kisi TWK, TIU, dan TKP. Buat jadwal belajar yang realistis, kerjakan latihan secara rutin, dan tinjau kembali pembahasan soal untuk mengetahui bagian yang perlu ditingkatkan.',
                'image' => 'images/news/cpns-preparation.svg',
            ],
            [
                'slug' => 'tips-mengerjakan-soal-tiu',
                'title' => 'Tips Mengelola Waktu Saat Mengerjakan TIU',
                'summary' => 'Dahulukan soal yang dapat dikerjakan dengan yakin dan sisihkan waktu untuk meninjau jawaban.',
                'content' => 'Baca instruksi setiap soal dengan teliti. Jika menemui soal yang memerlukan waktu lebih lama, lanjutkan dahulu ke soal lain dan kembali saat masih ada waktu. Latihan berkala membantu mengenali pola soal dan meningkatkan ketepatan.',
            ],
        ] as $item) {
            News::query()->updateOrCreate(
                ['slug' => $item['slug']],
                [
                    ...$item,
                    'is_published' => true,
                    'published_at' => now(),
                ],
            );
        }
    }
}
