<?php

namespace Database\Seeders;

use App\Models\PracticePackage;
use Illuminate\Database\Seeder;

class TiuSyncPackageSeeder extends Seeder
{
    public function run(): void
    {
        $package = PracticePackage::query()->updateOrCreate(
            ['slug' => 'tiu-sinkron-server'],
            [
                'category' => 'tiu',
                'title' => 'TIU Paket Sinkronisasi Server',
                'description' => 'Paket TIU tambahan dari server untuk menguji sinkronisasi paket terbaru.',
                'passing_score' => 12,
                'is_published' => true,
            ],
        );

        $questions = [
            [
                'question' => 'Delapan pekerja menyelesaikan pekerjaan dalam 15 hari. Jika kemampuan setiap pekerja sama, berapa hari yang dibutuhkan 12 pekerja?',
                'options' => ['8 hari', '10 hari', '12 hari', '18 hari', '22,5 hari'],
                'correct' => 1,
                'explanation' => 'Jumlah pekerjaan tetap: 8 × 15 = 12 × hari, sehingga diperlukan 10 hari.',
            ],
            [
                'question' => 'Tentukan angka berikutnya pada deret 2, 5, 11, 23, 47, ...',
                'options' => ['71', '87', '94', '95', '96'],
                'correct' => 3,
                'explanation' => 'Setiap suku dikalikan 2 lalu ditambah 1. Jadi 47 × 2 + 1 = 95.',
            ],
            [
                'question' => 'Rata-rata dari 68, 72, 75, dan 85 adalah ...',
                'options' => ['72', '73', '74', '75', '76'],
                'correct' => 3,
                'explanation' => 'Jumlah seluruh nilai 300. Rata-rata = 300 ÷ 4 = 75.',
            ],
            [
                'question' => 'Nilai $\\frac{3}{5}$ dari 240 adalah ...',
                'options' => ['120', '132', '144', '156', '180'],
                'correct' => 2,
                'explanation' => '$\\frac{3}{5} \\times 240 = 3 \\times 48 = 144$.',
            ],
            [
                'question' => 'Semua anggota kelompok A adalah anggota kelompok B. Tidak ada anggota kelompok B yang menjadi anggota kelompok C. Kesimpulan yang tepat adalah ...',
                'options' => [
                    'Sebagian anggota A adalah anggota C',
                    'Semua anggota C adalah anggota A',
                    'Tidak ada anggota A yang menjadi anggota C',
                    'Semua anggota B adalah anggota A',
                    'Hubungan kelompok A dan C tidak dapat disimpulkan',
                ],
                'correct' => 2,
                'explanation' => 'Karena A termasuk dalam B dan B tidak beririsan dengan C, maka A juga tidak beririsan dengan C.',
            ],
        ];

        foreach ($questions as $index => $item) {
            $question = $package->questions()->updateOrCreate(
                ['order' => $index + 1],
                [
                    'question' => $item['question'],
                    'explanation' => $item['explanation'],
                    'weight' => 5,
                ],
            );

            $question->options()->delete();

            foreach ($item['options'] as $optionIndex => $answer) {
                $question->options()->create([
                    'label' => chr(65 + $optionIndex),
                    'answer' => $answer,
                    'score' => $optionIndex === $item['correct'] ? 1 : 0,
                    'is_correct' => $optionIndex === $item['correct'],
                    'order' => $optionIndex + 1,
                ]);
            }
        }
    }
}
