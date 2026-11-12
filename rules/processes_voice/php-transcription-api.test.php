<?php
// lexcode-expect: 12
// Sending recorded speech to a speech-to-text service from PHP: OpenAI's audio endpoints
// through openai-php/client and the Laravel facade, Amazon Transcribe batch jobs, Google Cloud
// Speech-to-Text requests imported, aliased and written in full, and the Speech-to-Text REST
// service of google/apiclient-services, imported and written in full (its aliased import is in
// php-transcription-api.test.alias.php).
namespace App\Services;

use Aws\TranscribeService\TranscribeServiceClient;
use Google\Cloud\Speech\V1\RecognitionAudio as SpeechAudio;
use Google\Cloud\Speech\V1\RecognitionConfig;
use Google\Cloud\Speech\V1\SpeechClient;
use Google\Cloud\Speech\V2\Client\SpeechClient as SpeechV2Client;
use Google\Cloud\Speech\V2\RecognizeRequest;
use Google\Service\Speech;
use OpenAI\Laravel\Facades\OpenAI;

class VoicemailTranscriber
{
    public function __construct(private $openai, private TranscribeServiceClient $transcribe)
    {
    }

    public function withOpenAi(string $path): string
    {
        $result = $this->openai->audio()->transcribe([
            'model' => 'whisper-1',
            'file' => fopen($path, 'r'),
        ]);
        $english = $this->openai->audio()->translate(['model' => 'whisper-1', 'file' => fopen($path, 'r')]);
        $viaFacade = OpenAI::audio()->transcribe(['model' => 'whisper-1', 'file' => fopen($path, 'r')]);
        return $result->text . $english->text . $viaFacade->text;
    }

    public function withAws(string $key, string $job): void
    {
        $this->transcribe->startTranscriptionJob([
            'TranscriptionJobName' => $job,
            'LanguageCode' => 'en-US',
            'Media' => ['MediaFileUri' => "s3://voicemail/$key"],
        ]);
        $this->transcribe->startMedicalTranscriptionJob(['MedicalTranscriptionJobName' => $job]);
        $this->transcribe->startCallAnalyticsJobAsync(['CallAnalyticsJobName' => $job]);
    }

    public function withGoogleV1(string $bytes): array
    {
        $audio = (new SpeechAudio())->setContent($bytes);
        $config = (new RecognitionConfig())->setLanguageCode('en-US');
        return (new SpeechClient())->recognize($config, $audio)->getResults();
    }

    public function withGoogleV2(string $bytes, string $recognizer): array
    {
        $request = (new RecognizeRequest())->setRecognizer($recognizer)->setContent($bytes);
        $batch = new \Google\Cloud\Speech\V2\BatchRecognizeRequest(['recognizer' => $recognizer]);
        return (new SpeechV2Client())->recognize($request)->getResults();
    }

    public function withRestClient($client): array
    {
        return [
            new Speech($client),
            new \Google\Service\Speech($client),
            new \Google_Service_Speech($client),
        ];
    }
}
