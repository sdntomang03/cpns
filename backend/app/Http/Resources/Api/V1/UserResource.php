<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'role' => $this->role,
            'profile' => [
                'phone' => $this->profile?->phone,
                'institution' => $this->profile?->institution,
                'target_position' => $this->profile?->target_position,
                'province' => $this->profile?->province,
                'city' => $this->profile?->city,
                'avatar' => $this->profile?->avatar,
            ],
        ];
    }
}
