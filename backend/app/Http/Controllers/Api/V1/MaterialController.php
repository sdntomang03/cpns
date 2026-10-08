<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\IndexMaterialsRequest;
use App\Http\Resources\Api\V1\MaterialResource;
use App\Models\Material;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class MaterialController extends Controller
{
    public function index(IndexMaterialsRequest $request): JsonResponse
    {
        $syncWatermark = now()->toISOString();
        $validated = $request->validated();
        $query = Material::query()
            ->with('category')
            ->orderBy('updated_at')
            ->orderBy('id');

        if (isset($validated['updated_since'])) {
            $query->withTrashed()
                ->where('updated_at', '>=', Carbon::parse($validated['updated_since']))
                ->where(function ($visibilityQuery) {
                    $visibilityQuery->where('is_published', true)
                        ->orWhereNotNull('published_at');
                });
        } else {
            $query->where('is_published', true);
        }

        if (isset($validated['category'])) {
            $query->whereHas('category', fn ($categoryQuery) => $categoryQuery
                ->where('slug', $validated['category']));
        }

        $materials = $query->paginate($validated['per_page'] ?? 20);
        $publishedTotal = Material::query()->where('is_published', true)->count();

        return response()->json([
            'success' => true,
            'message' => 'Materi berhasil diambil',
            'data' => MaterialResource::collection($materials->items())->resolve(),
            'meta' => [
                'current_page' => $materials->currentPage(),
                'last_page' => $materials->lastPage(),
                'per_page' => $materials->perPage(),
                'total' => $materials->total(),
                'published_total' => $publishedTotal,
                'next_page' => $materials->nextPageUrl() ? $materials->currentPage() + 1 : null,
                'server_time' => $syncWatermark,
            ],
        ]);
    }

    public function show(Request $request, int $material): JsonResponse
    {
        $record = Material::query()
            ->with('category')
            ->where('is_published', true)
            ->findOrFail($material);

        return response()->json([
            'success' => true,
            'message' => 'Materi berhasil diambil',
            'data' => (new MaterialResource($record))->resolve(),
            'meta' => (object) [],
        ]);
    }
}
