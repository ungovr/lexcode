<?php
// lexcode-expect: 8
// The visitor's IP address written into a log or a database.

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\LoginAttempt;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Psr\Log\LoggerInterface;
use Symfony\Component\HttpFoundation\Request as HttpRequest;

class AuditController
{
    public function __construct(private LoggerInterface $logger)
    {
    }

    public function record(Request $request, string $action): void
    {
        // Laravel: an Eloquent row, through an array built first.
        $data = [
            'user_id' => auth()->id(),
            'action' => $action,
            'ip_address' => request()->ip(),
        ];
        ActivityLog::create($data);

        // Laravel: the address in the create call itself.
        LoginAttempt::create(['email' => $request->input('email'), 'ip' => $request->ip()]);

        // Laravel: a query-builder insert.
        DB::table('visits')->insert([
            'path' => $request->path(),
            'ip' => $request->ip(),
        ]);

        // Laravel: an attribute on a model that is then saved.
        $attempt = new LoginAttempt();
        $attempt->ip_address = $request->ip();
        $attempt->save();

        // Laravel: a log line.
        Log::info('Signed in from ' . $request->ip());

        // A chain split over lines, which the rule's text test must admit.
        Log::notice('Profile updated', [
            'ip' => $request
                ->ip(),
        ]);
    }

    public function symfony(HttpRequest $request): void
    {
        // Symfony: a PSR-3 logger with the address in its context.
        $this->logger->warning('Failed sign-in', ['ip' => $request->getClientIp()]);
    }

    public function plain(): void
    {
        // Plain PHP: the server array, through a variable, into the error log.
        $ip = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'];
        error_log("comment posted from {$ip}");
    }
}
