<?php
// lexcode-expect: 0
// Calls that sit beside speech-to-text and are not it. Text to speech reads out text a user
// typed (OpenAI audio()->speech(), Amazon Polly, Google Text-to-Speech), which the definition
// leaves out. A chat completion and a text translation take no voice. Amazon Transcribe's
// vocabulary list holds words, not speech. The app has its own RecognizeRequest and
// RecognitionAudio classes, the Google Speech short names in another namespace, imported and
// written in full, and a Speech class of its own. Google's classes of those names are imported
// here only under aliases, so the short names are the app's.
namespace App\Services;

use App\Media\RecognizeRequest;
use App\Media\Speech;
use Aws\Polly\PollyClient;
use Aws\TranscribeService\TranscribeServiceClient;
use Google\Cloud\Speech\V2\RecognizeRequest as CloudRecognizeRequest;
use Google\Cloud\TextToSpeech\V1\SynthesizeSpeechRequest;
use Google\Service\Speech as SpeechService;
use OpenAI\Laravel\Facades\OpenAI;

class Announcer
{
    public function __construct(
        private $openai,
        private PollyClient $polly,
        private TranscribeServiceClient $transcribe,
        private $translator,
    ) {
    }

    public function readAloud(string $text): string
    {
        $audio = $this->openai->audio()->speech([
            'model' => 'tts-1',
            'voice' => 'alloy',
            'input' => $text,
        ]);
        $this->polly->synthesizeSpeech(['Text' => $text, 'OutputFormat' => 'mp3', 'VoiceId' => 'Joanna']);
        $request = (new SynthesizeSpeechRequest())->setInput($text);
        OpenAI::audio()->speech(['model' => 'tts-1', 'voice' => 'nova', 'input' => $text]);
        return $audio;
    }

    public function reply(string $question): string
    {
        $answer = OpenAI::chat()->create([
            'model' => 'gpt-4o-mini',
            'messages' => [['role' => 'user', 'content' => $question]],
        ]);
        return $this->translator->translate($answer->choices[0]->message->content, ['target' => 'fr']);
    }

    public function vocabularies(): array
    {
        return $this->transcribe->listVocabularies(['MaxResults' => 10])->toArray();
    }

    public function queue(string $query): array
    {
        $request = new RecognizeRequest($query);
        $local = new \App\Media\RecognitionAudio($query);
        $speech = new Speech($query);
        return [$request, $local, $speech];
    }
}
