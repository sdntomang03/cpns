<?php

use App\Http\Controllers\Api\V1\AdminNotificationController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\DashboardController;
use App\Http\Controllers\Api\V1\FcmDeviceController;
use App\Http\Controllers\Api\V1\MaterialController;
use App\Http\Controllers\Api\V1\NewsController;
use App\Http\Controllers\Api\V1\PracticeController;
use App\Http\Controllers\Api\V1\ProfileController;
use App\Http\Controllers\Api\V1\RankingController;
use App\Http\Controllers\Api\V1\TryoutController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::middleware('throttle:5,1')->group(function () {
        Route::post('/auth/register', [AuthController::class, 'register']);
        Route::post('/auth/login', [AuthController::class, 'login']);
    });

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::get('/profile', [ProfileController::class, 'show']);
        Route::put('/profile', [ProfileController::class, 'update']);
        Route::post('/notifications/device', [FcmDeviceController::class, 'store']);
        Route::delete('/notifications/device', [FcmDeviceController::class, 'destroy']);
        Route::get('/news', [NewsController::class, 'index']);
        Route::get('/news/{news:slug}', [NewsController::class, 'show']);
        Route::get('/dashboard/summary', [DashboardController::class, 'summary']);
        Route::get('/ranking/national', [RankingController::class, 'national']);
        Route::get('/ranking/me', [RankingController::class, 'me']);
        Route::get('/materials', [MaterialController::class, 'index']);
        Route::get('/materials/{material}', [MaterialController::class, 'show'])->whereNumber('material');
        Route::get('/practice/packages', [PracticeController::class, 'index']);
        Route::post('/practice/packages/{package}/result', [PracticeController::class, 'submit'])
            ->whereNumber('package');
        Route::post('/practice/progress/sync', [PracticeController::class, 'syncProgress']);
        Route::get('/tryouts', [TryoutController::class, 'index']);
        Route::post('/tryouts/{tryout}/start', [TryoutController::class, 'start'])->whereNumber('tryout');
        Route::post('/tryout-attempts/{attempt}/answer', [TryoutController::class, 'answer']);
        Route::post('/tryout-attempts/{attempt}/submit', [TryoutController::class, 'submit']);
        Route::get('/tryout-attempts/{attempt}/result', [TryoutController::class, 'result']);

        Route::middleware('admin')->prefix('admin')->group(function () {
            Route::get('/news', [NewsController::class, 'index']);
            Route::post('/news', [NewsController::class, 'store']);
            Route::put('/news/{news}', [NewsController::class, 'update']);
            Route::delete('/news/{news}', [NewsController::class, 'destroy']);
            Route::post('/notifications/broadcast', [AdminNotificationController::class, 'broadcast'])
                ->middleware('throttle:5,1');
        });
    });
});
