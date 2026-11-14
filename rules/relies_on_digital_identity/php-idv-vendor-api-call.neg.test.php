<?php
// lexcode-expect: 0
// The app's own API, and ordinary third-party APIs that check nobody's identity. A link to a
// vendor's marketing or documentation page is not an API call, and neither is a log line, an
// exception message or a constant that names a vendor's API without calling it.

namespace App\Services;

use GuzzleHttp\Client;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Symfony\Contracts\HttpClient\HttpClientInterface;

class Clients
{
    public const LEGACY = 'https://api.onfido.com/v3.6/checks';

    public function __construct(private Client $guzzle, private HttpClientInterface $http)
    {
    }

    public function calls(int $id): array
    {
        return [
            $this->guzzle->get("https://api.example.org/v1/users/{$id}"),
            Http::asForm()->post('https://api.stripe.com/v1/payment_intents', ['amount' => 100]),
            $this->http->request('GET', 'https://api.weather.example.net/v2/forecast'),
            curl_init('https://auth.example.org/api/v1/session'),
            new Client(['base_uri' => 'https://api.example.org/v1/']),
        ];
    }

    public function links(): array
    {
        return [
            $this->guzzle->get('https://www.onfido.com/pricing'),
            file_get_contents('https://yoti.com/blog/age-estimation-explained'),
        ];
    }

    public function mentions(): void
    {
        Log::info('https://api.onfido.com/v3.6/checks is no longer used');
        Log::warning('https://api.sumsub.com/resources/applicants returned an error');
        error_log('https://api.yoti.com/idverify/v1/sessions timed out');
        throw new \RuntimeException('https://stationapi.veriff.com/v1/sessions is unreachable');
    }
}
