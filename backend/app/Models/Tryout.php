<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Tryout extends Model
{
    protected $fillable = ['title', 'description', 'is_published'];

    protected function casts(): array
    {
        return ['is_published' => 'boolean'];
    }

    public function sections(): HasMany
    {
        return $this->hasMany(TryoutSection::class)->orderBy('order');
    }

    public function attempts(): HasMany
    {
        return $this->hasMany(TryoutAttempt::class);
    }
}
