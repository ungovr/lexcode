<?php
// lexcode-expect: 2
// Google's Speech-to-Text classes imported under an alias: the REST service of
// google/apiclient-services and a Cloud Speech V2 recognize request.
namespace App\Jobs;

use Google\Cloud\Speech\V2\RecognizeRequest as SpeechRequest;
use Google\Service\Speech as SpeechService;

class TranscribeLecture
{
    public function handle($client, string $recognizer, string $bytes): array
    {
        $service = new SpeechService($client);
        $request = (new SpeechRequest())->setRecognizer($recognizer)->setContent($bytes);
        return [$service, $request];
    }
}
