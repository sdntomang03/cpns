<?php

namespace App\Services;

use App\Models\FcmDevice;
use Kreait\Firebase\Factory;
use Kreait\Firebase\Messaging\CloudMessage;
use Kreait\Firebase\Messaging\Notification;
use RuntimeException;

class FirebaseMessagingService
{
    public function broadcast(string $title, string $body, ?string $url = null): array
    {
        $credentials = config('services.firebase.credentials');
        $projectId = config('services.firebase.project_id');
        if (! $credentials || ! is_file($credentials) || ! $projectId) {
            throw new RuntimeException('Firebase belum dikonfigurasi. Atur FIREBASE_CREDENTIALS dan FIREBASE_PROJECT_ID.');
        }

        $messaging = (new Factory)
            ->withServiceAccount($credentials)
            ->withProjectId($projectId)
            ->createMessaging();
        $message = CloudMessage::new()
            ->withNotification(Notification::create($title, $body))
            ->withData(array_filter(['url' => $url]));
        $sent = 0;
        $failed = 0;

        FcmDevice::query()->select('id', 'token')->orderBy('id')->chunk(500, function ($devices) use (
            $messaging,
            $message,
            &$sent,
            &$failed,
        ): void {
            $report = $messaging->sendMulticast($message, $devices->pluck('token')->all());
            $sent += $report->successes()->count();
            $failed += $report->failures()->count();
        });

        return ['sent' => $sent, 'failed' => $failed];
    }
}
