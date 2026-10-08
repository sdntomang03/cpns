<?php

namespace Tests\Feature\Api\V1;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthAndProfileTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_register_and_receive_a_sanctum_token(): void
    {
        $response = $this->postJson('/api/v1/auth/register', [
            'name' => 'Peserta CPNS',
            'email' => 'peserta@example.com',
            'phone' => '081234567890',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
            'institution' => 'Instansi',
            'target_position' => 'Analis Kebijakan',
            'province' => 'DKI Jakarta',
            'city' => 'Jakarta Selatan',
        ]);

        $response->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.user.name', 'Peserta CPNS')
            ->assertJsonPath('data.user.role', 'user')
            ->assertJsonPath('data.user.profile.phone', '081234567890')
            ->assertJsonPath('data.user.profile.institution', 'Instansi')
            ->assertJsonPath('data.user.profile.target_position', 'Analis Kebijakan')
            ->assertJsonPath('data.token_type', 'Bearer')
            ->assertJsonStructure(['data' => ['token']]);

        $this->assertDatabaseHas('users', [
            'email' => 'peserta@example.com',
            'role' => 'user',
        ]);
        $this->assertDatabaseHas('profiles', [
            'province' => 'DKI Jakarta',
            'city' => 'Jakarta Selatan',
        ]);
    }

    public function test_registration_validation_uses_standard_api_error_shape(): void
    {
        $this->postJson('/api/v1/auth/register', [])
            ->assertUnprocessable()
            ->assertJsonPath('success', false)
            ->assertJsonPath('message', 'Validasi gagal')
            ->assertJsonValidationErrors(['name', 'email', 'password', 'province', 'city']);
    }

    public function test_user_can_login_read_and_update_profile_then_logout(): void
    {
        $user = User::factory()->create([
            'email' => 'peserta@example.com',
            'password' => 'Password123!',
        ]);
        $user->profile()->create([
            'phone' => '081234567890',
            'province' => 'DKI Jakarta',
            'city' => 'Jakarta Selatan',
        ]);

        $login = $this->postJson('/api/v1/auth/login', [
            'email' => 'peserta@example.com',
            'password' => 'Password123!',
            'remember' => false,
        ]);

        $login->assertOk()->assertJsonPath('success', true);
        $token = $login->json('data.token');
        $headers = ['Authorization' => "Bearer {$token}"];

        $this->withHeaders($headers)
            ->getJson('/api/v1/profile')
            ->assertOk()
            ->assertJsonPath('data.email', 'peserta@example.com')
            ->assertJsonPath('data.profile.province', 'DKI Jakarta');

        $this->withHeaders($headers)
            ->putJson('/api/v1/profile', [
                'name' => 'Nama Diperbarui',
                'city' => 'Bandung',
            ])
            ->assertOk()
            ->assertJsonPath('data.name', 'Nama Diperbarui')
            ->assertJsonPath('data.profile.city', 'Bandung');

        $this->withHeaders($headers)
            ->putJson('/api/v1/profile', [
                'institution' => 'Kementerian A',
                'target_position' => 'Analis Data',
            ])
            ->assertOk()
            ->assertJsonPath('data.profile.institution', 'Kementerian A')
            ->assertJsonPath('data.profile.target_position', 'Analis Data');

        $this->withHeaders($headers)
            ->postJson('/api/v1/auth/logout')
            ->assertOk()
            ->assertJsonPath('success', true);

        $this->app['auth']->forgetGuards();

        $this->withHeaders($headers)
            ->getJson('/api/v1/profile')
            ->assertUnauthorized();
    }

    public function test_login_rejects_invalid_credentials(): void
    {
        $this->postJson('/api/v1/auth/login', [
            'email' => 'missing@example.com',
            'password' => 'wrong-password',
        ])
            ->assertUnprocessable()
            ->assertJsonPath('success', false)
            ->assertJsonValidationErrors('email');
    }
}
