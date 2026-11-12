<?php
// lexcode-expect: 0
// The library facades and Livewire's Component imported under aliases, and the app's own
// classes of the same short names used by those names. The engine's `use X;` also matches
// `use X as Y;`, so each short-name branch has to step aside where the class is aliased.

namespace App\Http\Controllers;

use App\Fakes\Gemini;
use App\Fakes\Prism;
use App\Ui\Component;
use Gemini\Laravel\Facades\Gemini as GeminiFacade;
use Livewire\Component as LivewireComponent;
use Prism\Prism\Facades\Prism as PrismFacade;

class DemoController extends Controller
{
    public function gemini(string $q)
    {
        $result = Gemini::generativeModel('gemini-2.0-flash')->generateContent($q);
        return response()->json(['answer' => $result->text()]);
    }

    public function prism(string $q)
    {
        $result = Prism::structured()->using('openai', 'gpt-4o')->withPrompt($q)->asStructured();
        return response()->json($result->structured);
    }
}

// The app's own Component, not Livewire's: its properties are not rendered by a view.
class AnswerCard extends Component
{
    public string $answer = '';

    public function refresh($client, string $q): void
    {
        $this->answer = $client->generativeModel('gemini-2.0-flash')->generateContent($q)->text();
    }
}
