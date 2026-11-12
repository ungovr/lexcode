<?php
// lexcode-expect: 6
// Speech a text-to-speech model made, sent back to the person who asked. The facades appear
// through an aliased import and fully qualified.

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use OpenAI\Laravel\Facades\OpenAI as LLM;
use Prism\Prism\Facades\Prism as PrismAI;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;

class NarrationController extends Controller
{
    // openai-php/laravel through an alias: the speech is the response body.
    public function read(Request $request)
    {
        $audio = LLM::audio()->speech(['model' => 'gpt-4o-mini-tts', 'voice' => 'alloy', 'input' => $request->input('text')]);
        return response($audio, 200, ['Content-Type' => 'audio/mpeg']);
    }

    // The same facade fully qualified: streamed to the browser.
    public function stream(Request $request)
    {
        $stream = \OpenAI\Laravel\Facades\OpenAI::audio()->speechStreamed(['model' => 'tts-1', 'voice' => 'nova', 'input' => $request->input('text')]);
        return response()->stream(function () use ($stream) {
            foreach ($stream as $chunk) {
                echo $chunk;
            }
        }, 200, ['Content-Type' => 'audio/mpeg']);
    }

    // Prism through an alias, and fully qualified.
    public function prism(Request $request)
    {
        $speech = PrismAI::audio()->using('openai', 'tts-1')->withInput($request->input('text'))->withVoice('alloy')->asAudio();
        return response(base64_decode($speech->audio->base64), 200, ['Content-Type' => 'audio/mpeg']);
    }

    public function prismQualified(Request $request)
    {
        $speech = \Prism\Prism\Prism::audio()
            ->using('elevenlabs', 'eleven_multilingual_v2')
            ->withInput($request->input('text'))
            ->asAudio();
        return ['audio' => $speech->audio->base64];
    }
}

class SpeakController extends AbstractController
{
    public function __construct(private $polly, private $client)
    {
    }

    // Amazon Polly: the synthesized stream is the response.
    public function polly(Request $request): Response
    {
        $result = $this->polly->synthesizeSpeech(['Text' => $request->get('text'), 'OutputFormat' => 'mp3', 'VoiceId' => 'Joanna']);
        return new Response($result['AudioStream']->getContents(), 200, ['Content-Type' => 'audio/mpeg']);
    }

    // openai-php on a client object, written to a file and sent.
    public function file(Request $request)
    {
        $audio = $this->client->audio()->speech(['model' => 'tts-1', 'voice' => 'echo', 'input' => $request->get('text')]);
        $path = sys_get_temp_dir() . '/speech.mp3';
        file_put_contents($path, $audio);
        return $this->file($path);
    }
}
