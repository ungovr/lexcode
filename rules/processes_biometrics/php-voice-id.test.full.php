<?php
// lexcode-expect: 1
// Amazon Connect Voice ID's client written in full with no import, scoring a call's speaker
// with a request built elsewhere.
namespace App\Support;

class FraudScreen
{
    public function check(array $request): string
    {
        $client = new \Aws\VoiceID\VoiceIDClient(['region' => 'us-east-1', 'version' => 'latest']);
        return $client->evaluateSession($request)['FraudDetectionResult']['Decision'];
    }
}
