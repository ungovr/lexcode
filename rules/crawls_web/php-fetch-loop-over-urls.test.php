<?php
// lexcode-expect: 14

namespace App\Monitor;

use GuzzleHttp\Client;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Http as Web;
use Symfony\Contracts\HttpClient\HttpClientInterface;

// A link monitor that fetches every address in a list it was given.
class LinkMonitor
{
    public function __construct(private Client $client, private HttpClientInterface $httpClient)
    {
    }

    // Plain PHP: curl and file_get_contents over a list of addresses.
    public function curl(array $urls): void
    {
        foreach ($urls as $url) {
            $ch = curl_init($url);
            curl_exec($ch);
        }
        foreach ($urls as $i => $pageUrl) {
            $handle = curl_init();
            curl_setopt($handle, CURLOPT_URL, $pageUrl);
            $html = file_get_contents($pageUrl);
            $headers = get_headers($pageUrl);
        }
    }

    // Guzzle and Symfony HttpClient.
    public function clients(array $sites): void
    {
        foreach ($sites as $site) {
            $this->client->get($site);
            $this->client->requestAsync('GET', $site);
            $this->httpClient->request('HEAD', $site);
            $this->client
                ->getAsync($site);
        }
    }

    // Laravel's HTTP client, in a closure over a collection and in array_map.
    public function laravel(array $links): array
    {
        collect($links)->each(function (string $link) {
            Http::timeout(5)->get($link);
        });

        foreach ($links as $link) {
            Web::head($link);
            \Illuminate\Support\Facades\Http::get($link);
        }

        return array_map(fn ($link) => Http::get($link)->status(), $links);
    }

    // A crawl queue drained one address at a time.
    public function queue(array $queue): void
    {
        while ($next = array_shift($queue)) {
            $response = $this->client->get(
                $next,
                ['allow_redirects' => true]
            );
        }
    }

    // WordPress's HTTP API.
    public function wordpress(array $feeds): void
    {
        foreach ($feeds as $feed_url) {
            wp_remote_get($feed_url);
        }
    }
}
