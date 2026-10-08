<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\StoreNewsRequest;
use App\Models\News;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;

class NewsController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $admin = $request->user()->role === 'admin';
        $news = News::query()
            ->when(! $admin, fn ($query) => $query->where('is_published', true)->whereNotNull('published_at'))
            ->orderByDesc('published_at')
            ->orderByDesc('id')
            ->paginate(min(max((int) $request->integer('per_page', 10), 1), 50));

        return response()->json([
            'success' => true,
            'message' => 'Berita berhasil diambil',
            'data' => $news->items(),
            'meta' => [
                'current_page' => $news->currentPage(),
                'last_page' => $news->lastPage(),
                'per_page' => $news->perPage(),
                'total' => $news->total(),
            ],
        ]);
    }

    public function show(News $news, Request $request): JsonResponse
    {
        abort_unless(
            $request->user()->role === 'admin' || ($news->is_published && $news->published_at !== null),
            404,
        );

        return response()->json([
            'success' => true,
            'message' => 'Berita berhasil diambil',
            'data' => $news,
            'meta' => (object) [],
        ]);
    }

    public function store(StoreNewsRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['slug'] ??= Str::slug($data['title']);
        $data['published_at'] = ($data['is_published'] ?? false) ? now() : null;
        if ($request->hasFile('image')) {
            $data['image'] = $this->storeImage($request);
        }
        $news = News::query()->create($data);

        return response()->json([
            'success' => true,
            'message' => 'Berita berhasil dibuat',
            'data' => $news,
            'meta' => (object) [],
        ], 201);
    }

    public function update(StoreNewsRequest $request, News $news): JsonResponse
    {
        $data = $request->validated();
        if ($request->hasFile('image')) {
            $newImage = $this->storeImage($request);
            $this->deleteStoredImage($news);
            $data['image'] = $newImage;
        } elseif (array_key_exists('image', $data) && $data['image'] !== $news->getRawOriginal('image')) {
            $this->deleteStoredImage($news);
        }
        if (array_key_exists('is_published', $data)) {
            $data['published_at'] = $data['is_published']
                ? ($news->published_at ?? now())
                : null;
        }
        $news->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Berita berhasil diperbarui',
            'data' => $news->refresh(),
            'meta' => (object) [],
        ]);
    }

    public function destroy(News $news): JsonResponse
    {
        $this->deleteStoredImage($news);
        $news->delete();

        return response()->json([
            'success' => true,
            'message' => 'Berita berhasil dihapus',
            'data' => null,
            'meta' => (object) [],
        ]);
    }

    private function storeImage(StoreNewsRequest $request): string
    {
        $path = $request->file('image')->store('news', 'public');
        if ($path === false) {
            throw new RuntimeException('Gambar berita gagal disimpan.');
        }

        return $path;
    }

    private function deleteStoredImage(News $news): void
    {
        $path = $news->getRawOriginal('image');
        if (is_string($path) && Str::startsWith($path, 'news/')) {
            Storage::disk('public')->delete($path);
        }
    }
}
