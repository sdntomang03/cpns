<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class TryoutSection extends Model
{
    protected $fillable = ['tryout_id', 'name', 'category', 'duration', 'passing_grade', 'order'];

    protected function casts(): array
    {
        return [
            'duration' => 'integer',
            'passing_grade' => 'integer',
            'order' => 'integer',
        ];
    }

    public function tryout(): BelongsTo
    {
        return $this->belongsTo(Tryout::class);
    }

    public function questions(): BelongsToMany
    {
        return $this->belongsToMany(PracticeQuestion::class, 'tryout_section_questions')
            ->withPivot('order')
            ->orderByPivot('order');
    }
}
