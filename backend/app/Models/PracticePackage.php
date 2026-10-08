<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PracticePackage extends Model
{
    protected $fillable = [
        'slug',
        'category',
        'title',
        'description',
        'passing_score',
        'is_published',
    ];

    protected function casts(): array
    {
        return [
            'passing_score' => 'integer',
            'is_published' => 'boolean',
        ];
    }

    public function questions(): HasMany
    {
        return $this->hasMany(PracticeQuestion::class)->orderBy('order');
    }
}
