<?php

namespace App\Services;

use App\Models\PracticePackage;
use Illuminate\Support\Collection;

class PracticeScoringService
{
    public function score(PracticePackage $package, Collection $answerByQuestion): array
    {
        $score = 0;
        $correctCount = 0;
        $wrongCount = 0;
        $unansweredCount = 0;

        $results = $package->questions->map(function ($question) use (
            $answerByQuestion,
            &$score,
            &$correctCount,
            &$wrongCount,
            &$unansweredCount,
        ) {
            $answer = $answerByQuestion->get($question->id);
            $selectedOption = $answer
                ? $question->options->firstWhere('id', (int) $answer['option_id'])
                : null;
            $earned = $selectedOption ? $selectedOption->score * $question->weight : 0;
            $score += $earned;

            if (! $selectedOption) {
                $unansweredCount++;
            } elseif ($selectedOption->is_correct) {
                $correctCount++;
            } else {
                $wrongCount++;
            }

            return [
                'question_id' => $question->id,
                'option_id' => $selectedOption?->id,
                'score' => $earned,
                'is_correct' => $selectedOption?->is_correct ?? false,
                'explanation' => $question->explanation,
                'correct_option_ids' => $question->options
                    ->where('is_correct', true)
                    ->pluck('id')
                    ->values(),
            ];
        });

        return [
            'package_id' => $package->id,
            'score' => $score,
            'max_score' => $this->maxScore($package->questions),
            'passing_score' => $package->passing_score,
            'passed' => $score >= $package->passing_score,
            'correct_count' => $correctCount,
            'wrong_count' => $wrongCount,
            'unanswered_count' => $unansweredCount,
            'results' => $results,
        ];
    }

    public function maxScore(Collection $questions): float|int
    {
        return $questions->sum(
            fn ($question) => $question->weight * ($question->options->max('score') ?? 0),
        );
    }
}
