<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PracticeQuestion extends Model
{
    protected $fillable = [
        'practice_package_id',
        'question',
        'image',
        'explanation',
        'weight',
        'order',
    ];

    protected function casts(): array
    {
        return ['weight' => 'integer', 'order' => 'integer'];
    }

    public function package(): BelongsTo
    {
        return $this->belongsTo(PracticePackage::class, 'practice_package_id');
    }

    public function options(): HasMany
    {
        return $this->hasMany(PracticeOption::class)->orderBy('order');
    }
}
