<?php
// lexcode-expect: 0
// Livewire's Component imported under an alias, and the app's own Component used by that name.
// The engine's `use X;` also matches `use X as Y;`, so the short-name branch has to step aside
// where the class is aliased.

namespace App\Ui;

use App\Ui\Base\Component;
use Illuminate\Support\Facades\Http;
use Livewire\Component as LivewireComponent;

// The app's own Component, not Livewire's: its properties are not rendered by a view.
class ClipCard extends Component
{
    public array $job = [];

    public function refresh(string $prompt): void
    {
        $this->job = Http::post('https://api.openai.com/v1/videos', ['model' => 'sora-2', 'prompt' => $prompt])->json();
    }
}
