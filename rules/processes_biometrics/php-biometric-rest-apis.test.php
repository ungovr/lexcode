<?php
// lexcode-expect: 6
// Calling face and voice matching APIs over HTTP from PHP: Azure Face identify and verify,
// Face++ compare and search, and VoiceIt voiceprint enrollment and verification.
namespace App\Identity;

use GuzzleHttp\Client;
use Illuminate\Support\Facades\Http;

class BiometricCheck
{
    public function __construct(private Client $http, private string $azure)
    {
    }

    public function azure(array $faceIds, string $group): array
    {
        $identify = $this->http->post("{$this->azure}/face/v1.0/identify", ['json' => ['faceIds' => $faceIds, 'personGroupId' => $group]]);
        $verify = Http::post($this->azure . '/face/v1.2-preview.1/verify', ['faceId1' => $faceIds[0], 'faceId2' => $faceIds[1]]);
        return [json_decode($identify->getBody(), true), $verify->json()];
    }

    public function faceplusplus(string $a, string $b, string $faceset): array
    {
        $compare = Http::asForm()->post('https://api-us.faceplusplus.com/facepp/v3/compare', ['image_url1' => $a, 'image_url2' => $b]);
        $search = Http::asForm()->post('https://api-us.faceplusplus.com/facepp/v3/search', ['image_url' => $a, 'faceset_token' => $faceset]);
        return [$compare->json(), $search->json()];
    }

    public function voiceit(string $userId, string $recording): array
    {
        $enroll = Http::attach('recording', fopen($recording, 'r'))->post("https://api.voiceit.io/enrollments/voice/$userId");
        $verify = Http::attach('recording', fopen($recording, 'r'))->post('https://api.voiceit.io/verification/voice', ['userId' => $userId]);
        return [$enroll->json(), $verify->json()];
    }
}
