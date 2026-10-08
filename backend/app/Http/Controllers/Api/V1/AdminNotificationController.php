<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\FirebaseMessagingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use RuntimeException;

class AdminNotificationController extends Controller
{
    public function broadcast(Request $request, FirebaseMessagingService $messaging): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'body' => ['required', 'string', 'max:2000'],
            'url' => ['nullable', 'string', 'max:2048'],
        ]);

        try {
            $result = $messaging->broadcast(
                $validated['title'],
                $validated['body'],
                $validated['url'] ?? null,
            );
        } catch (RuntimeException $error) {
            return response()->json([
                'success' => false,
                'message' => $error->getMessage(),
                'errors' => (object) [],
            ], 503);
        }

        return response()->json([
            'success' => true,
            'message' => 'Notifikasi broadcast berhasil diproses',
            'data' => $result,
            'meta' => (object) [],
        ]);
    }
}
