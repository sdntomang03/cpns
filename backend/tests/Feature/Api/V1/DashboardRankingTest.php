<?php

namespace Tests\Feature\Api\V1;

use App\Models\Tryout;
use App\Models\TryoutAttempt;
use App\Models\User;
use Database\Seeders\PracticePackagesSeeder;
use Database\Seeders\TryoutsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DashboardRankingTest extends TestCase
{
    use RefreshDatabase;

    public function test_dashboard_summary_uses_completed_server_tryout_results(): void
    {
        $this->getJson('/api/v1/dashboard/summary')->assertUnauthorized();

        $this->seed(PracticePackagesSeeder::class);
        $this->seed(TryoutsSeeder::class);
        $user = User::factory()->create();
        $tryout = Tryout::query()->firstOrFail();
        TryoutAttempt::query()->create([
            'uuid' => '05d8b040-aaca-4e53-bc06-19631d9b6a01',
            'user_id' => $user->id,
            'tryout_id' => $tryout->id,
            'status' => 'completed',
            'started_at' => now()->subHour(),
            'finished_at' => now(),
            'total_score' => 76,
            'max_score' => 150,
            'passed' => false,
            'result' => [
                'sections' => [[
                    'id' => 1,
                    'name' => 'TIU',
                    'score' => 25,
                    'max_score' => 50,
                    'passing_grade' => 23,
                    'results' => [['answer' => 'jawaban rahasia']],
                ]],
            ],
        ]);

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/dashboard/summary')
            ->assertOk()
            ->assertJsonPath('data.tryout_count', 1)
            ->assertJsonPath('data.best_score', 76)
            ->assertJsonPath('data.latest_tryout.total_score', 76)
            ->assertJsonPath('data.latest_tryout.result.sections.0.name', 'TIU')
            ->assertJsonMissingPath('data.latest_tryout.result.sections.0.results')
            ->assertJsonPath('data.latest_tryout.tryout.title', 'Try Out 1');
    }

    public function test_national_ranking_uses_best_completed_tryout_and_returns_current_user_rank(): void
    {
        $this->getJson('/api/v1/ranking/national')->assertUnauthorized();

        $this->seed(PracticePackagesSeeder::class);
        $this->seed(TryoutsSeeder::class);
        $tryout = Tryout::query()->firstOrFail();
        $first = User::factory()->create(['name' => 'Peserta Pertama']);
        $second = User::factory()->create(['name' => 'Peserta Kedua']);

        foreach ([[$first, 90, '05d8b040-aaca-4e53-bc06-19631d9b6a02'], [$second, 120, '05d8b040-aaca-4e53-bc06-19631d9b6a03']] as [$user, $score, $uuid]) {
            TryoutAttempt::query()->create([
                'uuid' => $uuid,
                'user_id' => $user->id,
                'tryout_id' => $tryout->id,
                'status' => 'completed',
                'started_at' => now()->subHour(),
                'finished_at' => now(),
                'total_score' => $score,
                'max_score' => 150,
                'passed' => false,
            ]);
        }

        $this->actingAs($first, 'sanctum')
            ->getJson('/api/v1/ranking/national')
            ->assertOk()
            ->assertJsonPath('data.rankings.0.name', 'Peserta Kedua')
            ->assertJsonPath('data.rankings.0.score', 120)
            ->assertJsonPath('data.me.rank', 2)
            ->assertJsonPath('data.me.score', 90);

        $this->getJson('/api/v1/ranking/me')
            ->assertOk()
            ->assertJsonPath('data.rank', 2)
            ->assertJsonPath('data.total_participants', 2);
    }
}
