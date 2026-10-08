<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MaterialResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'category' => $this->category?->slug,
            'category_name' => $this->category?->name,
            'title' => $this->title,
            'slug' => $this->slug,
            'content' => $this->is_published && ! $this->trashed() ? $this->content : null,
            'thumbnail' => $this->thumbnail,
            'order' => $this->order,
            'is_published' => $this->is_published,
            'published_at' => $this->published_at?->toISOString(),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
            'deleted_at' => $this->deleted_at?->toISOString(),
        ];
    }
}
