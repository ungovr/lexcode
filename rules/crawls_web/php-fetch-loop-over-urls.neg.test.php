<?php
// lexcode-expect: 0

namespace App\Sync;

use GuzzleHttp\Client;
use Illuminate\Support\Facades\Http;
use Psr\SimpleCache\CacheInterface;

// The app calls its own API and one documented partner API, loops over ids rather than addresses,
// and loops over addresses only to look them up, route them or read local files.
class OrderSync
{
    private string $base = 'https://orders.internal.example.com';

    public function __construct(private Client $client, private CacheInterface $cache)
    {
    }

    // The loop variable is an id; the address is built from the app's own base.
    public function pull(array $orderIds): void
    {
        foreach ($orderIds as $id) {
            $this->client->get($this->base . '/api/orders/' . $id);
            Http::withToken($this->token())->get($this->base . '/api/orders/' . $id . '/lines');
        }
        array_map(fn ($id) => Http::get("{$this->base}/api/orders/{$id}"), $orderIds);
    }

    // One scheduled call to a documented partner API, not in a loop.
    public function rates(): array
    {
        return Http::get('https://api.stripe.com/v1/exchange_rates')->json();
    }

    // Addresses looked up, parsed or routed, never fetched.
    public function seen(array $urls, \Redis $redis, Session $session): array
    {
        $hits = [];
        foreach ($urls as $url) {
            $hits[] = $this->cache->get($url);
            $hits[] = $redis->get($url);
            $hits[] = $session->get($url);
            $hits[] = parse_url($url, PHP_URL_HOST);
        }

        return $hits;
    }

    // Local files read in a loop.
    public function sizes(array $paths): int
    {
        $total = 0;
        foreach ($paths as $path) {
            $total += strlen(file_get_contents($path));
            $handle = fopen($path, 'r');
        }

        return $total;
    }

    private function token(): string
    {
        return (string) getenv('ORDERS_TOKEN');
    }
}
