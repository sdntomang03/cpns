<?php

namespace Database\Seeders;

use App\Models\PracticePackage;
use App\Models\Tryout;
use Illuminate\Database\Seeder;

class TryoutsSeeder extends Seeder
{
    public function run(): void
    {
        $tryout = Tryout::query()
            ->whereIn('title', ['Try Out Nasional #1', 'Try Out 1'])
            ->first() ?? new Tryout;
        $tryout->fill([
            'title' => 'Try Out 1',
            'description' => 'Try Out contoh dengan hasil dan ketuntasan per sesi.',
            'is_published' => true,
        ])->save();

        $sections = [
            ['tiu', 'TIU', 35, 80, 175, 1],
            ['twk', 'TWK', 30, 65, 150, 2],
            ['tkp', 'TKP', 45, 166, 225, 3],
        ];

        foreach ($sections as [$category, $name, $duration, $referencePassingGrade, $referenceMaxScore, $order]) {
            $section = $tryout->sections()->updateOrCreate(
                ['category' => $category],
                [
                    'name' => $name,
                    'duration' => $duration,
                    'passing_grade' => $referencePassingGrade,
                    'order' => $order,
                ],
            );

            $questions = PracticePackage::query()
                ->where('category', $category)
                ->where('is_published', true)
                ->with('questions.options')
                ->get()
                ->flatMap(fn (PracticePackage $package) => $package->questions)
                ->unique('id')
                ->values();

            $section->questions()->sync(
                $questions->mapWithKeys(fn ($question, $index) => [
                    $question->id => ['order' => $index + 1],
                ])->all(),
            );
            $maxScore = $questions->sum(
                fn ($question) => $question->weight * ($question->options->max('score') ?? 0),
            );
            $section->update([
                'passing_grade' => (int) ceil($referencePassingGrade * $maxScore / $referenceMaxScore),
            ]);
        }
    }
}
