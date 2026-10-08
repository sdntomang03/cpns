<?php

namespace Tests\Feature\Api\V1;

use App\Models\PracticePackage;
use App\Models\User;
use App\Services\PracticeScoringService;
use Database\Seeders\PracticePackagesSeeder;
use Database\Seeders\TiuSyncPackageSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PracticeTest extends TestCase
{
    use RefreshDatabase;

    public function test_practice_packages_require_authentication(): void
    {
        $this->getJson('/api/v1/practice/packages')->assertUnauthorized();
    }

    public function test_authenticated_user_can_get_packages_with_server_scoring_rules(): void
    {
        $this->seed(PracticePackagesSeeder::class);

        $this->actingAs(User::factory()->create(), 'sanctum')
            ->getJson('/api/v1/practice/packages')
            ->assertOk()
            ->assertJsonPath('meta.total', 6)
            ->assertJsonPath('data.0.title', 'TWK Paket 1')
            ->assertJsonPath('data.0.passing_score', 11)
            ->assertJsonPath('data.0.max_score', 25)
            ->assertJsonPath('data.0.questions.0.weight', 5)
            ->assertJsonPath('data.0.questions.0.options.0.score', 1)
            ->assertJsonPath('data.3.questions.0.image', '/figural/arrow-sequence.svg')
            ->assertJsonPath('data.3.questions.0.options.0.image', '/figural/arrow-up.svg');

        $this->assertDatabaseHas('practice_packages', ['slug' => 'tkp-paket-1']);
        $tkp = PracticePackage::query()->where('slug', 'tkp-paket-1')->with('questions.options')->firstOrFail();
        $this->assertEquals(25, app(PracticeScoringService::class)->maxScore($tkp->questions));
    }

    public function test_server_scores_objective_and_tkp_answers_using_question_and_option_weights(): void
    {
        $this->seed(PracticePackagesSeeder::class);
        $user = User::factory()->create();
        $this->actingAs($user, 'sanctum');

        $twk = PracticePackage::query()->where('slug', 'twk-paket-1')->with('questions.options')->firstOrFail();
        $correctAnswers = $twk->questions->map(fn ($question) => [
            'question_id' => $question->id,
            'option_id' => $question->options->firstWhere('is_correct', true)->id,
        ])->all();

        $this->postJson("/api/v1/practice/packages/{$twk->id}/result", ['answers' => $correctAnswers])
            ->assertOk()
            ->assertJsonPath('data.score', 25)
            ->assertJsonPath('data.max_score', 25)
            ->assertJsonPath('data.passing_score', 11)
            ->assertJsonPath('data.passed', true);

        $tkp = PracticePackage::query()->where('slug', 'tkp-paket-1')->with('questions.options')->firstOrFail();
        $tkpAnswers = $tkp->questions->map(fn ($question) => [
            'question_id' => $question->id,
            'option_id' => $question->options->last()->id,
        ])->all();

        $this->postJson("/api/v1/practice/packages/{$tkp->id}/result", ['answers' => $tkpAnswers])
            ->assertOk()
            ->assertJsonPath('data.score', 10)
            ->assertJsonPath('data.max_score', 25)
            ->assertJsonPath('data.passing_score', 19)
            ->assertJsonPath('data.passed', false);
    }

    public function test_result_scores_partial_and_empty_answer_sets_with_unanswered_questions(): void
    {
        $this->seed(PracticePackagesSeeder::class);
        $this->actingAs(User::factory()->create(), 'sanctum');
        $package = PracticePackage::query()->where('slug', 'twk-paket-1')->with('questions.options')->firstOrFail();
        $firstQuestion = $package->questions->first();
        $correctOption = $firstQuestion->options->firstWhere('is_correct', true);

        $this->postJson("/api/v1/practice/packages/{$package->id}/result", [
            'answers' => [[
                'question_id' => $firstQuestion->id,
                'option_id' => $correctOption->id,
            ]],
        ])->assertOk()
            ->assertJsonPath('data.score', 5)
            ->assertJsonPath('data.correct_count', 1)
            ->assertJsonPath('data.wrong_count', 0)
            ->assertJsonPath('data.unanswered_count', 4)
            ->assertJsonPath('data.max_score', 25);

        $this->postJson("/api/v1/practice/packages/{$package->id}/result", ['answers' => []])
            ->assertOk()
            ->assertJsonPath('data.score', 0)
            ->assertJsonPath('data.correct_count', 0)
            ->assertJsonPath('data.wrong_count', 0)
            ->assertJsonPath('data.unanswered_count', 5)
            ->assertJsonPath('data.passed', false);
    }

    public function test_result_rejects_an_option_from_another_question(): void
    {
        $this->seed(PracticePackagesSeeder::class);
        $this->actingAs(User::factory()->create(), 'sanctum');
        $package = PracticePackage::query()->where('slug', 'twk-paket-1')->with('questions.options')->firstOrFail();
        $firstQuestion = $package->questions->first();
        $secondQuestion = $package->questions->get(1);

        $this->postJson("/api/v1/practice/packages/{$package->id}/result", [
            'answers' => [[
                'question_id' => $firstQuestion->id,
                'option_id' => $secondQuestion->options->first()->id,
            ]],
        ])->assertUnprocessable()
            ->assertJsonPath('success', false);
    }

    public function test_practice_progress_sync_is_authenticated_and_idempotent(): void
    {
        $this->postJson('/api/v1/practice/progress/sync', ['attempts' => []])->assertUnauthorized();

        $user = User::factory()->create();
        $attempt = [
            'uuid' => '550e8400-e29b-41d4-a716-446655440000',
            'package_slug' => 'twk-paket-1',
            'category' => 'twk',
            'package_title' => 'TWK Paket 1',
            'score' => 65,
            'max_score' => 100,
            'passing_score' => 65,
            'correct_count' => 3,
            'wrong_count' => 1,
            'unanswered_count' => 1,
            'completed_at' => now()->toISOString(),
        ];

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/practice/progress/sync', ['attempts' => [$attempt]])
            ->assertOk()
            ->assertJsonPath('data.synced_uuids.0', $attempt['uuid']);

        $this->postJson('/api/v1/practice/progress/sync', ['attempts' => [$attempt]])
            ->assertOk()
            ->assertJsonPath('meta.total', 1);

        $this->assertDatabaseCount('practice_attempts', 1);
        $this->assertDatabaseHas('practice_attempts', [
            'uuid' => $attempt['uuid'],
            'user_id' => $user->id,
            'passed' => true,
            'unanswered_count' => 1,
        ]);
    }

    public function test_practice_seeder_is_idempotent_and_creates_two_packages_per_category(): void
    {
        $seeder = app(PracticePackagesSeeder::class);
        $seeder->run();
        $seeder->run();

        $this->assertDatabaseCount('practice_packages', 6);
        $this->assertDatabaseCount('practice_questions', 30);
        $this->assertDatabaseCount('practice_options', 150);
        $this->assertDatabaseHas('practice_packages', ['slug' => 'tkp-paket-2', 'passing_score' => 19]);
    }

    public function test_server_tiu_sync_package_is_included_in_the_practice_api(): void
    {
        $this->seed(PracticePackagesSeeder::class);
        $seeder = app(TiuSyncPackageSeeder::class);
        $seeder->run();
        $seeder->run();

        $response = $this->actingAs(User::factory()->create(), 'sanctum')
            ->getJson('/api/v1/practice/packages')
            ->assertOk()
            ->assertJsonPath('meta.total', 7);
        $package = collect($response->json('data'))->firstWhere('slug', 'tiu-sinkron-server');

        $this->assertNotNull($package);
        $this->assertSame('TIU Paket Sinkronisasi Server', $package['title']);
        $this->assertSame(5, $package['question_count']);
        $this->assertSame(5, $package['questions'][3]['weight']);
        $this->assertSame('Nilai $\\frac{3}{5}$ dari 240 adalah ...', $package['questions'][3]['question']);

        $this->assertDatabaseCount('practice_packages', 7);
        $this->assertDatabaseCount('practice_questions', 35);
        $this->assertDatabaseCount('practice_options', 175);
    }
}
