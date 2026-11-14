<?php
// lexcode-expect: 7
// Posting recorded speech to a speech-to-text endpoint over HTTP from PHP, through Laravel's
// Http client, Guzzle and plain curl: Deepgram, AssemblyAI upload and transcript, OpenAI
// transcription, ElevenLabs speech-to-text and Google Speech-to-Text.
namespace App\Services;

use GuzzleHttp\Client;
use Illuminate\Support\Facades\Http;

class CallTranscriber
{
    public function __construct(private Client $http)
    {
    }

    public function transcribe(string $path): array
    {
        $deepgram = Http::withHeaders(['Authorization' => 'Token ' . config('services.deepgram.key')])
            ->withBody(file_get_contents($path), 'audio/wav')
            ->post('https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true');

        $upload = $this->http->post('https://api.assemblyai.com/v2/upload', ['body' => fopen($path, 'r')]);
        $job = $this->http->post("https://api.assemblyai.com/v2/transcript", [
            'json' => ['audio_url' => json_decode($upload->getBody())->upload_url],
        ]);

        $openai = Http::attach('file', fopen($path, 'r'), 'call.wav')
            ->post('https://api.openai.com/v1/audio/transcriptions', ['model' => 'whisper-1']);

        $ch = curl_init('https://api.elevenlabs.io/v1/speech-to-text');
        curl_setopt($ch, CURLOPT_POSTFIELDS, ['file' => new \CURLFile($path), 'model_id' => 'scribe_v1']);
        $eleven = curl_exec($ch);

        $google = Http::post(
            'https://speech.googleapis.com/v1/speech:recognize',
            ['config' => ['languageCode' => 'en-US'], 'audio' => ['content' => base64_encode(file_get_contents($path))]],
        );
        $long = Http::post('https://speech.googleapis.com/v1p1beta1/speech:longrunningrecognize', []);

        return [$deepgram->json(), $job->getBody(), $openai->json(), $eleven, $google->json(), $long->json()];
    }
}
