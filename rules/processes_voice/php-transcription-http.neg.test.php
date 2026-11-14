<?php
// lexcode-expect: 0
// HTTP calls to the same vendors that are not speech-to-text: text to speech, which reads out
// text a user typed (OpenAI's speech endpoint, ElevenLabs text-to-speech, Google
// Text-to-Speech, Deepgram's speak endpoint), a chat completion, and a transcription URL that
// sits in a comment, not in code: https://api.deepgram.com/v1/listen
namespace App\Services;

use GuzzleHttp\Client;
use Illuminate\Support\Facades\Http;

class Narrator
{
    public function __construct(private Client $http)
    {
    }

    public function speak(string $text): string
    {
        $openai = Http::withToken(config('services.openai.key'))
            ->post('https://api.openai.com/v1/audio/speech', ['model' => 'tts-1', 'input' => $text, 'voice' => 'alloy']);
        $eleven = $this->http->post("https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM", [
            'json' => ['text' => $text],
        ]);
        $google = Http::post('https://texttospeech.googleapis.com/v1/text:synthesize', ['input' => ['text' => $text]]);
        $deepgram = Http::post('https://api.deepgram.com/v1/speak?model=aura-asteria-en', ['text' => $text]);
        $chat = Http::post('https://api.openai.com/v1/chat/completions', ['model' => 'gpt-4o-mini']);
        return $openai->body() . $eleven->getBody() . $google->body() . $deepgram->body() . $chat->body();
    }
}
