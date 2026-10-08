<?php

namespace App\Services;

use App\Models\Tryout;
use App\Models\TryoutAttempt;
use App\Models\TryoutAttemptAnswer;
use App\Models\TryoutSection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class TryoutService
{
    public function start(Tryout $tryout, int $userId): array
    {
        [$tryout, $attempt] = DB::transaction(function () use ($tryout, $userId) {
            $tryout = Tryout::query()
                ->whereKey($tryout->id)
                ->lockForUpdate()
                ->firstOrFail()
                ->load(['sections.questions.options']);

            abort_if(
                ! $tryout->is_published
                    || $tryout->sections->isEmpty()
                    || $tryout->sections->contains(fn ($section) => $section->questions->isEmpty()),
                422,
                'Try Out belum memiliki soal lengkap.',
            );

            $attempt = $tryout->attempts()
                ->where('user_id', $userId)
                ->latest('id')
                ->first();

            abort_if(
                $attempt?->status === 'completed',
                409,
                'Try Out ini sudah pernah dikerjakan dan tidak dapat diulang.',
            );

            if (! $attempt) {
                $attempt = $tryout->attempts()->create([
                    'uuid' => (string) Str::uuid(),
                    'user_id' => $userId,
                    'status' => 'in_progress',
                    'started_at' => now(),
                ]);
            }

            return [$tryout, $attempt];
        });
        $durationSeconds = $tryout->sections->sum('duration') * 60;
        $elapsedSeconds = now()->timestamp - $attempt->started_at->timestamp;
        $savedAnswers = $attempt->answers()
            ->get(['practice_question_id', 'practice_option_id'])
            ->map(fn (TryoutAttemptAnswer $answer) => [
                'question_id' => $answer->practice_question_id,
                'option_id' => $answer->practice_option_id,
            ])
            ->values();

        return [
            'attempt_id' => $attempt->uuid,
            'remaining_seconds' => max(0, $durationSeconds - $elapsedSeconds),
            'answers' => $savedAnswers,
            'tryout' => $this->serializeTryout($tryout, includeQuestions: true),
        ];
    }

    public function saveAnswer(TryoutAttempt $attempt, int $questionId, ?int $optionId): void
    {
        $attempt->loadMissing('tryout.sections.questions.options');
        abort_if($attempt->status !== 'in_progress', 409, 'Try Out sudah selesai.');

        $question = $attempt->tryout->sections
            ->flatMap(fn ($section) => $section->questions)
            ->firstWhere('id', $questionId);
        abort_if(! $question, 422, 'Soal tidak termasuk dalam Try Out ini.');

        if ($optionId !== null && ! $question->options->contains('id', $optionId)) {
            throw ValidationException::withMessages([
                'option_id' => ['Pilihan jawaban tidak sesuai dengan soal.'],
            ]);
        }

        TryoutAttemptAnswer::query()->updateOrCreate(
            [
                'tryout_attempt_id' => $attempt->id,
                'practice_question_id' => $questionId,
            ],
            [
                'practice_option_id' => $optionId,
                'answered_at' => $optionId === null ? null : now(),
            ],
        );
    }

    public function submit(TryoutAttempt $attempt): array
    {
        if ($attempt->status === 'completed') {
            return $this->result($attempt);
        }

        return DB::transaction(function () use ($attempt) {
            $attempt->load(['tryout.sections.questions.options', 'answers.option']);
            $sectionResults = $attempt->tryout->sections->map(function (TryoutSection $section) use ($attempt) {
                $answers = $attempt->answers->keyBy('practice_question_id');
                $score = 0;
                $maxScore = 0;
                $correctCount = 0;
                $questionResults = $section->questions->map(function ($question) use (
                    $answers,
                    &$score,
                    &$maxScore,
                    &$correctCount,
                ) {
                    $answer = $answers->get($question->id);
                    $selected = $answer?->option;
                    $earned = $selected ? $selected->score * $question->weight : 0;
                    $score += $earned;
                    $maxScore += $question->weight * ($question->options->max('score') ?? 0);
                    $isCorrect = (bool) ($selected?->is_correct ?? false);
                    $correctCount += $isCorrect ? 1 : 0;

                    return [
                        'question_id' => $question->id,
                        'question' => $question->question,
                        'image' => $question->image,
                        'options' => $question->options->map(fn ($option) => [
                            'id' => $option->id,
                            'label' => $option->label,
                            'answer' => $option->answer,
                            'image' => $option->image,
                        ])->values(),
                        'selected_option_id' => $selected?->id,
                        'score' => $earned,
                        'is_correct' => $isCorrect,
                        'correct_option_ids' => $question->options->where('is_correct', true)->pluck('id')->values(),
                        'explanation' => $question->explanation,
                    ];
                });

                return [
                    'id' => $section->id,
                    'name' => $section->name,
                    'category' => $section->category,
                    'passing_grade' => $section->passing_grade,
                    'score' => $score,
                    'max_score' => $maxScore,
                    'passed' => $score >= $section->passing_grade,
                    'correct_count' => $correctCount,
                    'question_count' => $section->questions->count(),
                    'results' => $questionResults,
                ];
            });

            $totalScore = $sectionResults->sum('score');
            $maxScore = $sectionResults->sum('max_score');
            $passed = $sectionResults->every(fn ($section) => $section['passed']);

            $result = [
                'attempt_id' => $attempt->uuid,
                'title' => $attempt->tryout->title,
                'total_score' => $totalScore,
                'max_score' => $maxScore,
                'passed' => $passed,
                'sections' => $sectionResults->values()->all(),
            ];

            $attempt->update([
                'status' => 'completed',
                'finished_at' => now(),
                'total_score' => $totalScore,
                'max_score' => $maxScore,
                'passed' => $passed,
                'result' => $result,
            ]);

            return $result;
        });
    }

    public function result(TryoutAttempt $attempt): array
    {
        if ($attempt->result !== null) {
            return $attempt->result;
        }

        $attempt->load(['tryout.sections.questions.options', 'answers.option']);

        return $this->submitResult($attempt);
    }

    public function serializeTryout(
        Tryout $tryout,
        bool $includeQuestions = false,
        ?TryoutAttempt $attempt = null,
    ): array
    {
        return [
            'id' => $tryout->id,
            'title' => $tryout->title,
            'description' => $tryout->description,
            'duration_minutes' => $tryout->sections->sum('duration'),
            'attempt_status' => $attempt?->status,
            'attempt_id' => $attempt?->uuid,
            'sections' => $tryout->sections->map(fn (TryoutSection $section) => [
                'id' => $section->id,
                'name' => $section->name,
                'category' => $section->category,
                'duration' => $section->duration,
                'passing_grade' => $section->passing_grade,
                'question_count' => $section->questions->count(),
                'questions' => $includeQuestions
                    ? $section->questions->map(fn ($question) => [
                        'id' => $question->id,
                        'question' => $question->question,
                        'image' => $question->image,
                        'weight' => $question->weight,
                        'options' => $question->options->map(fn ($option) => [
                            'id' => $option->id,
                            'label' => $option->label,
                            'answer' => $option->answer,
                            'image' => $option->image,
                        ])->values(),
                    ])->values()
                    : [],
            ])->values(),
        ];
    }

    private function submitResult(TryoutAttempt $attempt): array
    {
        $sections = $attempt->tryout->sections->map(function (TryoutSection $section) use ($attempt) {
            $answers = $attempt->answers->keyBy('practice_question_id');
            $score = 0;
            $maxScore = 0;
            $correctCount = 0;
            $results = $section->questions->map(function ($question) use ($answers, &$score, &$maxScore, &$correctCount) {
                $selected = $answers->get($question->id)?->option;
                $earned = $selected ? $selected->score * $question->weight : 0;
                $score += $earned;
                $maxScore += $question->weight * ($question->options->max('score') ?? 0);
                $correct = (bool) ($selected?->is_correct ?? false);
                $correctCount += $correct ? 1 : 0;

                return [
                    'question_id' => $question->id,
                    'question' => $question->question,
                    'image' => $question->image,
                    'options' => $question->options->map(fn ($option) => [
                        'id' => $option->id,
                        'label' => $option->label,
                        'answer' => $option->answer,
                        'image' => $option->image,
                    ])->values(),
                    'selected_option_id' => $selected?->id,
                    'score' => $earned,
                    'is_correct' => $correct,
                    'correct_option_ids' => $question->options->where('is_correct', true)->pluck('id')->values(),
                    'explanation' => $question->explanation,
                ];
            });

            return [
                'id' => $section->id,
                'name' => $section->name,
                'category' => $section->category,
                'passing_grade' => $section->passing_grade,
                'score' => $score,
                'max_score' => $maxScore,
                'passed' => $score >= $section->passing_grade,
                'correct_count' => $correctCount,
                'question_count' => $section->questions->count(),
                'results' => $results,
            ];
        });

        return [
            'attempt_id' => $attempt->uuid,
            'title' => $attempt->tryout->title,
            'total_score' => $sections->sum('score'),
            'max_score' => $sections->sum('max_score'),
            'passed' => $sections->every(fn ($section) => $section['passed']),
            'sections' => $sections->values(),
        ];
    }
}
