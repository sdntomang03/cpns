<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class StoreNewsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if (! $this->filled('slug') && $this->filled('title')) {
            $this->merge(['slug' => Str::slug($this->input('title'))]);
        }
    }

    public function rules(): array
    {
        $news = $this->route('news');
        $imageRules = $this->hasFile('image')
            ? ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120']
            : ['nullable', 'url', 'max:2048'];

        return [
            'slug' => ['sometimes', 'required', 'string', 'max:255', Rule::unique('news', 'slug')->ignore($news)],
            'title' => ['required', 'string', 'max:255'],
            'summary' => ['nullable', 'string', 'max:1000'],
            'content' => ['required', 'string', 'max:50000'],
            'image' => $imageRules,
            'is_published' => ['sometimes', 'boolean'],
        ];
    }
}
