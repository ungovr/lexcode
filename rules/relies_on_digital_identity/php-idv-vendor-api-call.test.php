<?php
// lexcode-expect: 9
// Calling an identity-verification vendor's HTTP API directly: through Guzzle, Laravel's Http
// client, Symfony's HttpClient, a Guzzle base URI, curl and file_get_contents.

namespace App\Kyc;

use GuzzleHttp\Client;
use Illuminate\Support\Facades\Http;
use Symfony\Contracts\HttpClient\HttpClientInterface;

class VendorCalls
{
    public function __construct(private Client $guzzle, private HttpClientInterface $http)
    {
    }

    public function persona(string $reference): mixed
    {
        return $this->guzzle->post('https://api.withpersona.com/api/v1/inquiries', [
            'json' => ['data' => ['attributes' => ['reference-id' => $reference]]],
        ]);
    }

    public function veriff(): Client
    {
        return new Client(['base_uri' => 'https://stationapi.veriff.com/v1/', 'timeout' => 10]);
    }

    public function onfido(string $id): array
    {
        return [
            Http::withToken(config('services.onfido.token'))->get("https://api.eu.onfido.com/v3.6/checks/{$id}"),
            Http::post('https://api.onfido.com/v3.6/applicants', ['first_name' => 'A']),
        ];
    }

    public function sumsub(string $id): mixed
    {
        return $this->http->request('GET', "https://api.sumsub.com/resources/applicants/{$id}/one");
    }

    public function jumio(): mixed
    {
        $ch = curl_init('https://account.amer-1.jumio.ai/api/v1/accounts');
        curl_setopt($ch, CURLOPT_POST, true);
        return curl_exec($ch);
    }

    public function idnow(string $txn): mixed
    {
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, "https://gateway.idnow.io/api/v1/acme/identifications/{$txn}/start");
        return curl_exec($ch);
    }

    public function yoti(): string|false
    {
        return file_get_contents('https://api.yoti.com/idverify/v1/sessions');
    }

    public function persona_async(): mixed
    {
        return $this->guzzle->requestAsync('GET', 'https://withpersona.com/api/v1/inquiries/inq_1');
    }
}
