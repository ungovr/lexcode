<?php
// lexcode-expect: 0
// The library facades and Livewire's Component imported under aliases, and the app's own
// classes of the same short names used by those names. The engine's `use X;` also matches
// `use X as Y;`, so each short-name branch has to step aside where the class is aliased.

namespace App\Http\Controllers;

use Anthropic\Laravel\Facades\Anthropic as AnthropicFacade;
use App\Fakes\Anthropic;
use App\Fakes\OpenAI;
use App\Fakes\Prism;
use App\Ui\Component;
use Livewire\Component as LivewireComponent;
use OpenAI\Laravel\Facades\OpenAI as OpenAIFacade;
use Prism\Prism\Prism as PrismClient;

class DemoController extends Controller
{
    public function openai(string $q)
    {
        $result = OpenAI::chat()->create(['model' => 'gpt-4o', 'messages' => [['role' => 'user', 'content' => $q]]]);
        return response()->json(['reply' => $result]);
    }

    public function anthropic(string $q)
    {
        $result = Anthropic::messages()->create(['model' => 'claude-sonnet', 'max_tokens' => 100]);
        return response()->json(['reply' => $result]);
    }

    public function prism(string $q)
    {
        $result = Prism::text()->using('openai', 'gpt-4o')->withPrompt($q)->asText();
        return response()->json(['reply' => $result->text]);
    }
}

// The app's own Component, not Livewire's: its properties are not rendered by a view.
class SummaryCard extends Component
{
    public string $summary = '';

    public function refresh($llmClient, string $q): void
    {
        $result = $llmClient->chat()->create(['model' => 'gpt-4o', 'messages' => [['role' => 'user', 'content' => $q]]]);
        $this->summary = $result->choices[0]->message->content;
    }
}
