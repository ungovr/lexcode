<?php
// lexcode-expect: 2
// The facades imported under their own names: a Livewire component and a route closure.

namespace App\Livewire;

use Illuminate\Support\Facades\Route;
use Livewire\Component;
use OpenAI\Laravel\Facades\OpenAI;
use Prism\Prism\Prism;

Route::post('/logo', function () {
    $result = OpenAI::images()->create(['model' => 'dall-e-3', 'prompt' => request('brand')]);
    return $result->data[0]->url;
});

class Sketcher extends Component
{
    public string $prompt = '';

    public ?string $imageUrl = null;

    public function draw()
    {
        $response = Prism::image()->using('openai', 'dall-e-3')->withPrompt($this->prompt)->generate();
        $this->imageUrl = $response->firstImage()->url;
    }
}
