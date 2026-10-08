<?php

namespace Tests\Feature\Api\V1;

use App\Models\Category;
use App\Models\Material;
use App\Models\User;
use Database\Seeders\MaterialsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MaterialsTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_list_published_materials_by_category(): void
    {
        $category = Category::create(['name' => 'TIU', 'slug' => 'tiu']);
        $material = $category->materials()->create([
            'title' => 'Aritmetika Dasar',
            'slug' => 'aritmetika-dasar',
            'content' => '<p>Rumus $2x + 5 = 15$.</p>',
            'is_published' => true,
        ]);
        $category->materials()->create([
            'title' => 'Draft',
            'slug' => 'draft',
            'content' => 'Belum diterbitkan',
            'is_published' => false,
        ]);

        $this->actingAs(User::factory()->create(), 'sanctum')
            ->getJson('/api/v1/materials?category=tiu')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.0.id', $material->id)
            ->assertJsonPath('data.0.content', '<p>Rumus $2x + 5 = 15$.</p>')
            ->assertJsonPath('data.0.category', 'tiu')
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('meta.published_total', 1);
    }

    public function test_material_show_returns_not_found_for_unpublished_content(): void
    {
        $category = Category::create(['name' => 'TWK', 'slug' => 'twk']);
        $material = $category->materials()->create([
            'title' => 'Draft',
            'slug' => 'draft',
            'content' => 'Belum diterbitkan',
            'is_published' => false,
        ]);

        $this->actingAs(User::factory()->create(), 'sanctum')
            ->getJson("/api/v1/materials/{$material->id}")
            ->assertNotFound();
    }

    public function test_incremental_sync_includes_tombstones_without_exposing_hidden_content(): void
    {
        $category = Category::create(['name' => 'TWK', 'slug' => 'twk']);
        $material = $category->materials()->create([
            'title' => 'Materi Dihapus',
            'slug' => 'materi-dihapus',
            'content' => '<p>Konten rahasia setelah dihapus</p>',
            'is_published' => true,
        ]);
        $material->delete();

        $response = $this->actingAs(User::factory()->create(), 'sanctum')
            ->getJson('/api/v1/materials?updated_since=2020-01-01T00:00:00Z');

        $response->assertOk()
            ->assertJsonPath('data.0.id', $material->id)
            ->assertJsonPath('data.0.content', null)
            ->assertJsonPath('data.0.deleted_at', $material->fresh()->deleted_at->toISOString());
    }

    public function test_material_endpoint_requires_authentication_and_valid_sync_cursor(): void
    {
        $this->getJson('/api/v1/materials')->assertUnauthorized();

        $this->actingAs(User::factory()->create(), 'sanctum')
            ->getJson('/api/v1/materials?updated_since=not-a-date')
            ->assertUnprocessable()
            ->assertJsonPath('success', false)
            ->assertJsonValidationErrors('updated_since');
    }

    public function test_material_seeder_populates_all_categories_and_latex_content_idempotently(): void
    {
        $seeder = app(MaterialsSeeder::class);
        $seeder->run();

        $this->assertDatabaseCount('categories', 3);
        $this->assertDatabaseCount('materials', 18);
        $this->assertDatabaseHas('materials', [
            'slug' => 'aritmetika-dasar',
            'is_published' => true,
        ]);

        $content = Material::query()
            ->where('slug', 'aritmetika-dasar')
            ->value('content');

        $this->assertStringContainsString('$$\\text{nilai}', $content);
        $this->assertStringContainsString('$2x + 5 = 15$', $content);

        $seeder->run();
        $this->assertDatabaseCount('materials', 18);
    }
}
