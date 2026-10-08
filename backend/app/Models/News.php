<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class News extends Model
{
    protected $fillable = [
        'slug',
        'title',
        'summary',
        'content',
        'image',
        'is_published',
        'published_at',
    ];

    public function getImageAttribute(?string $value): ?string
    {
        if ($value === null || Str::startsWith($value, ['http://', 'https://'])) {
            return $value;
        }

        if (Str::startsWith($value, 'images/')) {
            return url($value);
        }

        return Storage::disk('public')->url($value);
    }

    protected function casts(): array
    {
        return [
            'is_published' => 'boolean',
            'published_at' => 'immutable_datetime',
        ];
    }
}
