<?php
// lexcode-expect: 0
// The library facades and Livewire's Component imported under aliases, and the app's own
// classes of the same short names used by those names. The engine's `use X;` also matches
// `use X as Y;`, so each short-name branch has to step aside where the class is aliased.

namespace App\Http\Controllers;

use App\Fakes\OpenAI;
use App\Fakes\Prism;
use App\Ui\Component;
use Livewire\Component as LivewireComponent;
use OpenAI\Laravel\Facades\OpenAI as OpenAIFacade;
use Prism\Prism\Prism as PrismClient;

class DemoController extends Controller
{
    public function openai(string $text)
    {
        $audio = OpenAI::audio()->speech(['model' => 'tts-1', 'input' => $text, 'voice' => 'alloy']);
        return response($audio, 200, ['Content-Type' => 'audio/mpeg']);
    }

    public function prism(string $text)
    {
        $audio = Prism::audio()->using('openai', 'tts-1')->withInput($text)->asAudio();
        return response($audio, 200, ['Content-Type' => 'audio/mpeg']);
    }
}

// The app's own Component, not Livewire's: its properties are not rendered by a view.
class ReadAloudCard extends Component
{
    public string $audio = '';

    public function refresh($client, string $text): void
    {
        $this->audio = $client->audio()->speech(['model' => 'tts-1', 'input' => $text, 'voice' => 'alloy']);
    }
}
