<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Material extends Model
{
    use SoftDeletes;

    protected static function booted(): void
    {
        static::saving(function (Material $material): void {
            if ($material->is_published && $material->published_at === null) {
                $material->published_at = now();
            }
        });
    }

    protected $fillable = [
        'category_id',
        'title',
        'slug',
        'content',
        'thumbnail',
        'order',
        'is_published',
    ];

    protected function casts(): array
    {
        return [
            'is_published' => 'boolean',
            'order' => 'integer',
            'published_at' => 'datetime',
        ];
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }
}
