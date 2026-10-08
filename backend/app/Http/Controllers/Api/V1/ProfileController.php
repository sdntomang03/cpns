<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\UpdateProfileRequest;
use App\Http\Resources\Api\V1\UserResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProfileController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $user = $request->user()->load('profile');

        return response()->json([
            'success' => true,
            'message' => 'Profil berhasil diambil',
            'data' => new UserResource($user),
            'meta' => (object) [],
        ]);
    }

    public function update(UpdateProfileRequest $request): JsonResponse
    {
        $user = DB::transaction(function () use ($request) {
            $user = $request->user();
            $data = $request->safe()->all();

            if (array_key_exists('name', $data)) {
                $user->update(['name' => $data['name']]);
            }

            $profileFields = ['phone', 'institution', 'target_position', 'province', 'city'];
            $profileData = array_intersect_key($data, array_flip($profileFields));

            if ($profileData !== []) {
                $user->profile()->updateOrCreate([], $profileData);
            }

            return $user->load('profile');
        });

        return response()->json([
            'success' => true,
            'message' => 'Profil berhasil diperbarui',
            'data' => new UserResource($user),
            'meta' => (object) [],
        ]);
    }
}
