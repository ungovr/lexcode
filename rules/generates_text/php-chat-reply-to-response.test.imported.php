<?php
// lexcode-expect: 3
// The facades imported under their own names, a route closure, a Livewire component, and a
// plain PHP endpoint that prints the model's reply.

namespace App\Livewire;

use Illuminate\Support\Facades\Route;
use Livewire\Component;
use OpenAI\Laravel\Facades\OpenAI;
use Prism\Prism\Prism;

Route::post('/rewrite', function () {
    $result = OpenAI::chat()->create(['model' => 'gpt-4o-mini', 'messages' => [['role' => 'user', 'content' => request('text')]]]);
    return $result->choices[0]->message->content;
});

class Summarizer extends Component
{
    public string $text = '';

    public string $summary = '';

    public function summarize()
    {
        $response = Prism::text()->using('openai', 'gpt-4o-mini')->withPrompt('Summarize: ' . $this->text)->asText();
        $this->summary = $response->text;
    }
}

function reply_endpoint($client)
{
    $completion = $client->completions()->create(['model' => 'gpt-3.5-turbo-instruct', 'prompt' => $_POST['q']]);
    header('Content-Type: text/plain');
    print $completion->choices[0]->text;
}
