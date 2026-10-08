<?php

namespace Tests\Feature\Api\V1;

use App\Models\News;
use App\Models\User;
use Database\Seeders\NewsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class NewsAndNotificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_users_only_see_published_news_while_admin_can_manage_news(): void
    {
        $published = News::query()->create([
            'slug' => 'tips-belajar',
            'title' => 'Tips Belajar',
            'content' => 'Buat jadwal belajar.',
            'is_published' => true,
            'published_at' => now(),
        ]);
        $draft = News::query()->create([
            'slug' => 'draft-berita',
            'title' => 'Draft',
            'content' => 'Belum diterbitkan.',
        ]);
        $user = User::factory()->create(['role' => 'user']);

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/news')
            ->assertOk()
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('data.0.slug', $published->slug);
        $this->getJson("/api/v1/news/{$draft->slug}")->assertNotFound();
        $this->postJson('/api/v1/admin/news', [
            'title' => 'Tidak boleh',
            'content' => 'Admin saja',
        ])->assertForbidden();

        $admin = User::factory()->create(['role' => 'admin']);
        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/v1/admin/news')
            ->assertOk()
            ->assertJsonPath('meta.total', 2);

        $this->postJson('/api/v1/admin/news', [
            'title' => 'Jadwal Seleksi CPNS',
            'summary' => 'Periksa pengumuman resmi.',
            'content' => 'Ikuti kanal resmi instansi.',
            'is_published' => true,
        ])->assertCreated()
            ->assertJsonPath('data.slug', 'jadwal-seleksi-cpns')
            ->assertJsonPath('data.is_published', true);

        $this->putJson("/api/v1/admin/news/{$draft->id}", [
            'title' => 'Draft diperbarui',
            'content' => 'Isi baru',
            'is_published' => true,
        ])->assertOk()
            ->assertJsonPath('data.is_published', true);

        $this->deleteJson("/api/v1/admin/news/{$draft->id}")
            ->assertOk();
        $this->assertDatabaseMissing('news', ['id' => $draft->id]);
    }

    public function test_fcm_device_token_is_authenticated_and_can_be_reassigned_safely(): void
    {
        $this->postJson('/api/v1/notifications/device', [
            'token' => 'fcm-token-example',
            'platform' => 'android',
        ])->assertUnauthorized();

        $firstUser = User::factory()->create();
        $secondUser = User::factory()->create();
        $this->actingAs($firstUser, 'sanctum')
            ->postJson('/api/v1/notifications/device', [
                'token' => 'fcm-token-example',
                'platform' => 'android',
            ])->assertCreated();

        $this->actingAs($secondUser, 'sanctum')
            ->postJson('/api/v1/notifications/device', [
                'token' => 'fcm-token-example',
                'platform' => 'android',
            ])->assertCreated();

        $this->assertDatabaseCount('fcm_devices', 1);
        $this->assertDatabaseHas('fcm_devices', [
            'user_id' => $secondUser->id,
            'token' => 'fcm-token-example',
        ]);

        $this->deleteJson('/api/v1/notifications/device', ['token' => 'fcm-token-example'])
            ->assertOk();
        $this->assertDatabaseMissing('fcm_devices', ['token' => 'fcm-token-example']);
    }

    public function test_admin_can_upload_news_image_and_users_receive_its_public_url(): void
    {
        Storage::fake('public');
        $admin = User::factory()->create(['role' => 'admin']);
        $this->actingAs($admin, 'sanctum')
            ->post('/api/v1/admin/news', [
                'title' => 'Berita dengan gambar',
                'content' => 'Isi berita.',
                'image' => UploadedFile::fake()->image('cover.jpg'),
                'is_published' => true,
            ], ['Accept' => 'application/json'])
            ->assertCreated()
            ->assertJsonPath('data.title', 'Berita dengan gambar');

        $news = News::query()->firstOrFail();
        $storedPath = $news->getRawOriginal('image');
        Storage::disk('public')->assertExists($storedPath);
        $imageUrl = Storage::disk('public')->url($storedPath);

        $this->actingAs(User::factory()->create(), 'sanctum')
            ->getJson('/api/v1/news')
            ->assertOk()
            ->assertJsonPath('data.0.image', $imageUrl);
        $this->getJson("/api/v1/news/{$news->slug}")
            ->assertOk()
            ->assertJsonPath('data.image', $imageUrl);

        $this->actingAs($admin, 'sanctum')
            ->deleteJson("/api/v1/admin/news/{$news->id}")
            ->assertOk();
        Storage::disk('public')->assertMissing($storedPath);
    }

    public function test_seeded_news_image_is_returned_as_a_server_url(): void
    {
        $this->seed(NewsSeeder::class);
        $user = User::factory()->create();

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/news/persiapan-seleksi-cpns')
            ->assertOk()
            ->assertJsonPath('data.image', url('images/news/cpns-preparation.svg'));
    }

    public function test_fcm_broadcast_is_admin_only_and_reports_missing_configuration(): void
    {
        $user = User::factory()->create(['role' => 'user']);
        $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/admin/notifications/broadcast', [
                'title' => 'Info',
                'body' => 'Ada berita baru',
            ])->assertForbidden();

        $admin = User::factory()->create(['role' => 'admin']);
        config(['services.firebase.credentials' => null, 'services.firebase.project_id' => null]);
        $this->actingAs($admin, 'sanctum')
            ->postJson('/api/v1/admin/notifications/broadcast', [
                'title' => 'Info',
                'body' => 'Ada berita baru',
            ])->assertServiceUnavailable()
            ->assertJsonPath('success', false);
    }
}
