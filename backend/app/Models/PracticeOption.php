<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PracticeOption extends Model
{
    protected $fillable = [
        'practice_question_id',
        'label',
        'answer',
        'image',
        'score',
        'is_correct',
        'order',
    ];

    protected function casts(): array
    {
        return ['score' => 'float', 'is_correct' => 'boolean', 'order' => 'integer'];
    }

    public function question(): BelongsTo
    {
        return $this->belongsTo(PracticeQuestion::class, 'practice_question_id');
    }
}
