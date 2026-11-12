<?php
// lexcode-expect: 2
// The facades imported under their own names: a route closure and a Livewire component.

namespace App\Livewire;

use Gemini\Laravel\Facades\Gemini;
use Illuminate\Support\Facades\Route;
use Livewire\Component;
use Prism\Prism\Facades\Prism;

Route::post('/describe', function () {
    $result = Gemini::generativeModel(model: 'gemini-2.0-flash')->generateContent(request('q'));
    return $result->text();
});

class OutlineBuilder extends Component
{
    public string $topic = '';

    public array $outline = [];

    public function build()
    {
        $response = Prism::structured()->using('openai', 'gpt-4o')->withPrompt($this->topic)->asStructured();
        $this->outline = $response->structured;
    }
}
