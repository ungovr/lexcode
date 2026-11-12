<?php
// lexcode-expect: 0
// The visitor's address is read but not kept: throttling, comparisons, a verification call,
// an address that belongs to a server, a value derived from the address, and a plain object
// or request context that carries it without storing it.

namespace App\Http\Controllers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Psr\Log\LoggerInterface;

class GuardController
{
    public function __construct(private LoggerInterface $logger)
    {
    }

    public function limits(Request $request): Limit
    {
        // Throttling by address keeps nothing beyond the rate window.
        return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
    }

    public function allow(Request $request): bool
    {
        // A comparison with an allow list: the address is not logged or stored.
        if ($request->ip() === '127.0.0.1') {
            Log::info('local request');
        }
        $allowed = in_array($request->ip(), config('admin.allowed_ips'), true);
        $this->logger->info('admin check', ['allowed' => $allowed]);

        return $allowed;
    }

    public function captcha(Request $request): bool
    {
        // The address goes only to a verification call.
        $response = Http::asForm()->post('https://captcha.example.test/verify', [
            'secret' => config('services.captcha.secret'),
            'response' => $request->input('captcha'),
            'remoteip' => $request->ip(),
        ]);

        return (bool) $response->json('success');
    }

    public function server(Server $server): void
    {
        // A server's address, not a visitor's.
        Deployment::create(['host_ip' => $server->ip(), 'status' => 'queued']);
        Log::info('deploying to ' . $server->ip());
    }

    public function count(): void
    {
        // An anonymous total that can no longer be tied to anyone.
        Cache::increment('visits:' . date('Y-m-d'));
    }

    public function region(Request $request, $user, $geo): void
    {
        // Only a country looked up from the address is stored, not the address.
        $user->update(['country' => $geo->lookup($request->ip())->country]);
    }
}

// A plain object that carries the address to a check and is then dropped.
class QuizParticipant
{
    public ?string $accessCode = null;
    public ?string $ip_address = null;
}

class QuizGate
{
    public function eligible(Request $request, string $code): bool
    {
        $participant = new QuizParticipant();
        $participant->accessCode = $code;
        $participant->ip_address = $request->ip();

        return $participant->accessCode !== null;
    }
}

// A request-scoped context object, set from the request and gone when the request ends.
class RequestContext
{
    public string $ipAddress;

    public function __construct(Request $request)
    {
        $this->ipAddress = $request->ip();
    }
}
