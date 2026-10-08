<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Tryout;
use App\Models\TryoutAttempt;
use App\Services\TryoutService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TryoutController extends Controller
{
    public function index(Request $request, TryoutService $service): JsonResponse
    {
        $attempts = TryoutAttempt::query()
            ->where('user_id', $request->user()->id)
            ->latest('id')
            ->get()
            ->unique('tryout_id')
            ->keyBy('tryout_id');

        $tryouts = Tryout::query()
            ->where('is_published', true)
            ->with(['sections.questions'])
            ->latest('id')
            ->get()
            ->map(fn (Tryout $tryout) => $service->serializeTryout(
                $tryout,
                attempt: $attempts->get($tryout->id),
            ));

        return response()->json([
            'success' => true,
            'message' => 'Daftar Try Out berhasil diambil',
            'data' => $tryouts,
            'meta' => ['total' => $tryouts->count()],
        ]);
    }

    public function start(Tryout $tryout, Request $request, TryoutService $service): JsonResponse
    {
        $data = $service->start($tryout, (int) $request->user()->id);

        return response()->json([
            'success' => true,
            'message' => 'Try Out dimulai',
            'data' => $data,
            'meta' => (object) [],
        ]);
    }

    public function answer(TryoutAttempt $attempt, Request $request, TryoutService $service): JsonResponse
    {
        abort_unless($attempt->user_id === $request->user()->id, 404);

        $validated = $request->validate([
            'question_id' => ['required', 'integer'],
            'option_id' => ['nullable', 'integer'],
        ]);
        $service->saveAnswer($attempt, $validated['question_id'], $validated['option_id'] ?? null);

        return response()->json([
            'success' => true,
            'message' => 'Jawaban tersimpan',
            'data' => ['question_id' => $validated['question_id']],
            'meta' => (object) [],
        ]);
    }

    public function submit(TryoutAttempt $attempt, Request $request, TryoutService $service): JsonResponse
    {
        abort_unless($attempt->user_id === $request->user()->id, 404);

        return response()->json([
            'success' => true,
            'message' => 'Hasil Try Out berhasil dihitung',
            'data' => $service->submit($attempt),
            'meta' => (object) [],
        ]);
    }

    public function result(TryoutAttempt $attempt, Request $request, TryoutService $service): JsonResponse
    {
        abort_unless($attempt->user_id === $request->user()->id, 404);
        abort_if($attempt->status !== 'completed', 409, 'Try Out belum selesai.');

        return response()->json([
            'success' => true,
            'message' => 'Hasil Try Out berhasil diambil',
            'data' => $service->result($attempt),
            'meta' => (object) [],
        ]);
    }
}
