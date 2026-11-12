<?php
// lexcode-expect: 0
// Speech a model makes that only the team hears, a person's recording that the app only plays or
// transcribes, and app classes that share a short name with a model library's facade.

namespace App\Http\Controllers;

use App\Models\Episode;
use App\Support\OpenAI;
use App\Support\Prism;
use Illuminate\Console\Command;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

// php artisan voice:sample: an engineer renders a voice sample to a local file to listen to it.
class VoiceSample extends Command
{
    protected $signature = 'voice:sample';

    public function handle()
    {
        $client = \OpenAI::client(env('OPENAI_API_KEY'));
        $audio = $client->audio()->speech(['model' => 'gpt-4o-mini-tts', 'voice' => 'alloy', 'input' => 'Testing one two three']);
        file_put_contents(storage_path('voice-sample.mp3'), $audio);
        echo 'wrote voice-sample.mp3' . PHP_EOL;
    }
}

class EpisodeController extends Controller
{
    // A person's own recording, played back as it was uploaded.
    public function play(Episode $episode)
    {
        return response()->file(Storage::path($episode->audio_path), ['Content-Type' => 'audio/mpeg']);
    }

    // Transcribing a person's recording reads it; it makes no sound.
    public function transcribe(Request $request, $client)
    {
        $transcript = $client->audio()->transcribe(['model' => 'whisper-1', 'file' => fopen($request->file('clip')->getRealPath(), 'r')]);
        $text = \Prism\Prism\Prism::audio()->using('openai', 'whisper-1')->withInput($request->file('clip'))->asText();
        return response()->json(['transcript' => $transcript->text, 'prism' => $text->text]);
    }

    // An app's own classes named OpenAI and Prism, in the app's namespace.
    public function own(Request $request)
    {
        $a = OpenAI::audio()->speech(['input' => $request->input('text')]);
        $b = Prism::audio()->using('house', 'voice')->withInput($request->input('text'))->asAudio();
        return response()->json(['a' => $a, 'b' => $b]);
    }
}
