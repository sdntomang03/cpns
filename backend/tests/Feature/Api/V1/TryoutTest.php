<?php

namespace Tests\Feature\Api\V1;

use App\Models\Tryout;
use App\Models\User;
use Database\Seeders\PracticePackagesSeeder;
use Database\Seeders\TryoutsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TryoutTest extends TestCase
{
    use RefreshDatabase;

    public function test_tryout_list_requires_authentication_and_exposes_server_sections(): void
    {
        $this->getJson('/api/v1/tryouts')->assertUnauthorized();

        $this->seed(PracticePackagesSeeder::class);
        $this->seed(TryoutsSeeder::class);
        $this->actingAs(User::factory()->create(), 'sanctum')
            ->getJson('/api/v1/tryouts')
            ->assertOk()
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('data.0.title', 'Try Out 1')
            ->assertJsonPath('data.0.duration_minutes', 110)
            ->assertJsonPath('data.0.sections.0.name', 'TIU')
            ->assertJsonPath('data.0.sections.0.question_count', 10)
            ->assertJsonPath('data.0.sections.1.name', 'TWK')
            ->assertJsonPath('data.0.sections.2.name', 'TKP');

        $this->seed(TryoutsSeeder::class);
        $this->assertDatabaseCount('tryouts', 1);
    }

    public function test_user_can_save_tryout_answers_and_get_server_scored_results_by_section(): void
    {
        $this->seed(PracticePackagesSeeder::class);
        $this->seed(TryoutsSeeder::class);
        $user = User::factory()->create();
        $this->actingAs($user, 'sanctum');
        $tryout = Tryout::query()->with('sections.questions.options')->firstOrFail();

        $start = $this->postJson("/api/v1/tryouts/{$tryout->id}/start")
            ->assertOk()
            ->assertJsonPath('data.tryout.duration_minutes', 110)
            ->assertJsonMissingPath('data.tryout.sections.0.questions.0.options.0.is_correct')
            ->assertJsonMissingPath('data.tryout.sections.0.questions.0.options.0.score')
            ->assertJsonPath('data.tryout.sections.0.questions.5.image', '/figural/arrow-sequence.svg')
            ->assertJsonPath('data.tryout.sections.0.questions.5.options.0.image', '/figural/arrow-up.svg');
        $attemptId = $start->json('data.attempt_id');

        foreach ($tryout->sections as $section) {
            foreach ($section->questions as $question) {
                $correctOption = $question->options->firstWhere('is_correct', true);
                $this->postJson("/api/v1/tryout-attempts/{$attemptId}/answer", [
                    'question_id' => $question->id,
                    'option_id' => $correctOption->id,
                ])->assertOk();
            }
        }

        $submission = $this->postJson("/api/v1/tryout-attempts/{$attemptId}/submit")
            ->assertOk()
            ->assertJsonPath('data.passed', true)
            ->assertJsonPath('data.total_score', 150)
            ->assertJsonPath('data.max_score', 150)
            ->assertJsonPath('data.sections.0.name', 'TIU')
            ->assertJsonPath('data.sections.0.passed', true)
            ->assertJsonPath('data.sections.1.name', 'TWK')
            ->assertJsonPath('data.sections.2.name', 'TKP')
            ->assertJsonPath('data.sections.2.max_score', 50);

        $this->postJson("/api/v1/tryout-attempts/{$attemptId}/submit")
            ->assertOk()
            ->assertExactJson($submission->json());

        $this->getJson("/api/v1/tryout-attempts/{$attemptId}/result")
            ->assertOk()
            ->assertJsonPath('data.passed', true);

        $this->postJson("/api/v1/tryouts/{$tryout->id}/start")
            ->assertConflict()
            ->assertJsonPath('message', 'Try Out ini sudah pernah dikerjakan dan tidak dapat diulang.');
        $this->assertDatabaseCount('tryout_attempts', 1);
        $this->getJson('/api/v1/tryouts')
            ->assertJsonPath('data.0.attempt_status', 'completed');
        $this->getJson("/api/v1/tryout-attempts/{$attemptId}/result")
            ->assertOk()
            ->assertJsonPath('data.attempt_id', $attemptId)
            ->assertJsonPath('data.sections.0.results.0.options.0.label', 'A');
    }

    public function test_starting_an_in_progress_tryout_resumes_the_same_attempt_and_saved_answers(): void
    {
        $this->seed(PracticePackagesSeeder::class);
        $this->seed(TryoutsSeeder::class);
        $this->actingAs(User::factory()->create(), 'sanctum');
        $tryout = Tryout::query()->with('sections.questions.options')->firstOrFail();
        $question = $tryout->sections->first()->questions->first();
        $option = $question->options->first();
        $firstStart = $this->postJson("/api/v1/tryouts/{$tryout->id}/start")->assertOk();
        $attemptId = $firstStart->json('data.attempt_id');

        $this->postJson("/api/v1/tryout-attempts/{$attemptId}/answer", [
            'question_id' => $question->id,
            'option_id' => $option->id,
        ])->assertOk();

        $this->travel(30)->seconds();
        $this->postJson("/api/v1/tryouts/{$tryout->id}/start")
            ->assertOk()
            ->assertJsonPath('data.attempt_id', $attemptId)
            ->assertJsonPath('data.answers.0.question_id', $question->id)
            ->assertJsonPath('data.answers.0.option_id', $option->id)
            ->assertJsonPath('data.remaining_seconds', 6570);

        $this->assertDatabaseCount('tryout_attempts', 1);
    }

    public function test_user_cannot_submit_an_answer_for_a_question_outside_their_tryout(): void
    {
        $this->seed(PracticePackagesSeeder::class);
        $this->seed(TryoutsSeeder::class);
        $this->actingAs(User::factory()->create(), 'sanctum');
        $tryout = Tryout::query()->firstOrFail();
        $attemptId = $this->postJson("/api/v1/tryouts/{$tryout->id}/start")->json('data.attempt_id');

        $this->postJson("/api/v1/tryout-attempts/{$attemptId}/answer", [
            'question_id' => 999999,
            'option_id' => null,
        ])->assertUnprocessable();
    }
}
