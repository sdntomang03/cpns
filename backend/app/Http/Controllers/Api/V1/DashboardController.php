<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\TryoutAttempt;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function summary(Request $request): JsonResponse
    {
        $attempts = TryoutAttempt::query()
            ->where('user_id', $request->user()->id)
            ->where('status', 'completed');
        $latestTryout = (clone $attempts)
            ->with('tryout:id,title')
            ->latest('finished_at')
            ->first(['id', 'tryout_id', 'total_score', 'max_score', 'passed', 'finished_at', 'result']);

        $summary = [
            'tryout_count' => (clone $attempts)->count(),
            'best_score' => (clone $attempts)->max('total_score') ?? 0,
            'average_score' => round((clone $attempts)->avg('total_score') ?? 0, 1),
            'latest_tryout' => $latestTryout ? [
                'id' => $latestTryout->id,
                'total_score' => $latestTryout->total_score,
                'max_score' => $latestTryout->max_score,
                'passed' => $latestTryout->passed,
                'finished_at' => $latestTryout->finished_at?->toISOString(),
                'tryout' => ['title' => $latestTryout->tryout?->title],
                'result' => [
                    'sections' => collect($latestTryout->result['sections'] ?? [])
                        ->map(fn (array $section) => [
                            'id' => $section['id'],
                            'name' => $section['name'],
                            'score' => $section['score'],
                            'max_score' => $section['max_score'],
                            'passing_grade' => $section['passing_grade'],
                        ])
                        ->values(),
                ],
            ] : null,
        ];

        return response()->json([
            'success' => true,
            'message' => 'Ringkasan dashboard berhasil diambil',
            'data' => $summary,
            'meta' => (object) [],
        ]);
    }
}
