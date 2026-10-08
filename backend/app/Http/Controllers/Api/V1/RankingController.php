<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class RankingController extends Controller
{
    public function national(Request $request): JsonResponse
    {
        $scores = $this->scoresWithUsers()
            ->orderByDesc('best_scores.score')
            ->orderBy('users.id')
            ->get([
                'users.id as user_id',
                'users.name',
                'best_scores.score',
            ]);

        $myRank = $scores->search(fn ($row) => (int) $row->user_id === (int) $request->user()->id);
        $top = $scores->take(20)->values()->map(fn ($row, $index) => [
            'rank' => $index + 1,
            'user_id' => $row->user_id,
            'name' => $row->name,
            'score' => (int) $row->score,
            'is_me' => (int) $row->user_id === (int) $request->user()->id,
        ]);
        $me = $myRank === false ? null : [
            'rank' => $myRank + 1,
            'user_id' => $scores[$myRank]->user_id,
            'name' => $scores[$myRank]->name,
            'score' => (int) $scores[$myRank]->score,
        ];

        return response()->json([
            'success' => true,
            'message' => 'Ranking nasional berhasil diambil',
            'data' => ['rankings' => $top, 'me' => $me],
            'meta' => ['total' => $scores->count()],
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        $scores = $this->scoresWithUsers()
            ->orderByDesc('score')
            ->orderBy('user_id')
            ->get();
        $position = $scores->search(fn ($row) => (int) $row->user_id === (int) $request->user()->id);

        return response()->json([
            'success' => true,
            'message' => 'Ranking pengguna berhasil diambil',
            'data' => $position === false ? null : [
                'rank' => $position + 1,
                'score' => (int) $scores[$position]->score,
                'total_participants' => $scores->count(),
                'name' => $scores[$position]->name,
            ],
            'meta' => ['total_participants' => $scores->count()],
        ]);
    }

    private function scoresWithUsers()
    {
        $bestScores = DB::table('tryout_attempts')
            ->select('user_id', DB::raw('MAX(total_score) as score'))
            ->where('status', 'completed')
            ->groupBy('user_id');

        return DB::query()
            ->fromSub($bestScores, 'best_scores')
            ->join('users', 'users.id', '=', 'best_scores.user_id')
            ->select('best_scores.user_id', 'best_scores.score', 'users.name');
    }
}
