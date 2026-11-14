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
use Prism\Prism\Facades\Prism as PrismFacade;

class DemoController extends Controller
{
    public function openai(string $brand)
    {
        $result = OpenAI::images()->create(['model' => 'dall-e-3', 'prompt' => $brand]);
        return response()->json(['url' => $result]);
    }

    public function prism(string $brand)
    {
        $response = Prism::image()->using('openai', 'dall-e-3')->withPrompt($brand)->generate();
        return response()->json(['url' => $response]);
    }
}

// The app's own Component, not Livewire's: its properties are not rendered by a view.
class LogoCard extends Component
{
    public ?string $imageUrl = null;

    public function refresh($openaiClient, string $brand): void
    {
        $result = $openaiClient->images()->create(['model' => 'dall-e-3', 'prompt' => $brand]);
        $this->imageUrl = $result->data[0]->url;
    }
}
