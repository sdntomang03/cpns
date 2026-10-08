<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\PracticePackage;
use App\Services\PracticeScoringService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PracticeController extends Controller
{
    public function index(PracticeScoringService $scoringService): JsonResponse
    {
        $packages = PracticePackage::query()
            ->where('is_published', true)
            ->with(['questions.options'])
            ->orderByRaw("CASE category WHEN 'twk' THEN 1 WHEN 'tiu' THEN 2 ELSE 3 END")
            ->orderBy('id')
            ->get();

        $data = $packages->map(
            fn (PracticePackage $package) => $this->serializePackage($package, $scoringService),
        );

        return response()->json([
            'success' => true,
            'message' => 'Paket latihan berhasil diambil',
            'data' => $data,
            'meta' => ['total' => $data->count(), 'server_time' => now()->toISOString()],
        ]);
    }

    public function submit(Request $request, int $package, PracticeScoringService $scoringService): JsonResponse
    {
        $validated = $request->validate([
            'answers' => ['sometimes', 'array', 'max:100'],
            'answers.*.question_id' => ['required', 'integer', 'distinct', 'exists:practice_questions,id'],
            'answers.*.option_id' => ['required', 'integer', 'exists:practice_options,id'],
        ]);

        $practicePackage = PracticePackage::query()
            ->where('is_published', true)
            ->with(['questions.options'])
            ->findOrFail($package);

        $answerByQuestion = collect($validated['answers'] ?? [])->keyBy('question_id');
        $questions = $practicePackage->questions;

        $questionById = $questions->keyBy('id');
        $hasInvalidAnswer = $answerByQuestion->contains(function ($answer, $questionId) use ($questionById) {
            $question = $questionById->get($questionId);

            return ! $question || ! $question->options->contains('id', (int) $answer['option_id']);
        });

        if ($hasInvalidAnswer) {
            return response()->json([
                'success' => false,
                'message' => 'Pilihan jawaban tidak sesuai dengan soal.',
                'errors' => ['answers' => ['Setiap pilihan harus berasal dari soal dalam paket ini.']],
            ], 422);
        }

        return response()->json([
            'success' => true,
            'message' => 'Hasil latihan berhasil dihitung',
            'data' => $scoringService->score($practicePackage, $answerByQuestion),
            'meta' => (object) [],
        ]);
    }

    public function syncProgress(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'attempts' => ['required', 'array', 'min:1', 'max:50'],
            'attempts.*.uuid' => ['required', 'uuid', 'distinct'],
            'attempts.*.package_slug' => ['required', 'string', 'max:120'],
            'attempts.*.category' => ['required', 'in:twk,tiu,tkp'],
            'attempts.*.package_title' => ['required', 'string', 'max:255'],
            'attempts.*.score' => ['required', 'numeric', 'min:0'],
            'attempts.*.max_score' => ['required', 'numeric', 'gt:0'],
            'attempts.*.passing_score' => ['required', 'numeric', 'min:0'],
            'attempts.*.correct_count' => ['required', 'integer', 'min:0'],
            'attempts.*.wrong_count' => ['required', 'integer', 'min:0'],
            'attempts.*.unanswered_count' => ['required', 'integer', 'min:0'],
            'attempts.*.completed_at' => ['required', 'date'],
        ]);

        $user = $request->user();
        $synced = DB::transaction(function () use ($validated, $user) {
            $uuids = [];

            foreach ($validated['attempts'] as $attempt) {
                $existing = DB::table('practice_attempts')->where('uuid', $attempt['uuid'])->first();

                if ($existing && (int) $existing->user_id !== (int) $user->id) {
                    abort(409, 'Progres latihan ini sudah terdaftar pada akun lain.');
                }

                DB::table('practice_attempts')->updateOrInsert(
                    ['uuid' => $attempt['uuid']],
                    [
                        ...$attempt,
                        'user_id' => $user->id,
                        'passed' => $attempt['score'] >= $attempt['passing_score'],
                        'updated_at' => now(),
                        'created_at' => $existing?->created_at ?? now(),
                    ],
                );
                $uuids[] = $attempt['uuid'];
            }

            return $uuids;
        });

        return response()->json([
            'success' => true,
            'message' => 'Progres latihan berhasil disinkronkan untuk statistik.',
            'data' => ['synced_uuids' => $synced],
            'meta' => ['total' => count($synced)],
        ]);
    }

    private function serializePackage(
        PracticePackage $package,
        PracticeScoringService $scoringService,
    ): array {
        $questions = $package->questions->map(fn ($question) => [
            'id' => $question->id,
            'question' => $question->question,
            'image' => $question->image,
            'explanation' => $question->explanation,
            'weight' => $question->weight,
            'order' => $question->order,
            'options' => $question->options->map(fn ($option) => [
                'id' => $option->id,
                'label' => $option->label,
                'answer' => $option->answer,
                'image' => $option->image,
                'score' => $option->score,
                'is_correct' => $option->is_correct,
                'order' => $option->order,
            ])->values(),
        ])->values();

        return [
            'id' => $package->id,
            'slug' => $package->slug,
            'category' => $package->category,
            'title' => $package->title,
            'description' => $package->description,
            'passing_score' => $package->passing_score,
            'question_count' => $questions->count(),
            'max_score' => $scoringService->maxScore($package->questions),
            'updated_at' => $package->updated_at?->toISOString(),
            'questions' => $questions,
        ];
    }
}
