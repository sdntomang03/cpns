<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TryoutAttemptAnswer extends Model
{
    protected $fillable = [
        'tryout_attempt_id',
        'practice_question_id',
        'practice_option_id',
        'answered_at',
    ];

    protected function casts(): array
    {
        return ['answered_at' => 'immutable_datetime'];
    }

    public function attempt(): BelongsTo
    {
        return $this->belongsTo(TryoutAttempt::class, 'tryout_attempt_id');
    }

    public function question(): BelongsTo
    {
        return $this->belongsTo(PracticeQuestion::class, 'practice_question_id');
    }

    public function option(): BelongsTo
    {
        return $this->belongsTo(PracticeOption::class, 'practice_option_id');
    }
}
