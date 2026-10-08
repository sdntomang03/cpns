<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TryoutAttempt extends Model
{
    protected $fillable = [
        'uuid',
        'user_id',
        'tryout_id',
        'status',
        'started_at',
        'finished_at',
        'total_score',
        'max_score',
        'passed',
        'result',
    ];

    protected function casts(): array
    {
        return [
            'started_at' => 'immutable_datetime',
            'finished_at' => 'immutable_datetime',
            'total_score' => 'integer',
            'max_score' => 'integer',
            'passed' => 'boolean',
            'result' => 'array',
        ];
    }

    public function getRouteKeyName(): string
    {
        return 'uuid';
    }

    public function tryout(): BelongsTo
    {
        return $this->belongsTo(Tryout::class);
    }

    public function answers(): HasMany
    {
        return $this->hasMany(TryoutAttemptAnswer::class);
    }
}
