<?php
// lexcode-expect: 0
// Calling a model somebody else trained is not training: a chat completion, an embedding, and
// reading or cancelling fine-tuning jobs that already exist. Uploading a file marked for
// fine-tuning starts nothing on its own. The look-alike is a booking system whose own client
// creates a "training job" (a first-aid course) with no training job name.
namespace App\Services;

use OpenAI\Laravel\Facades\OpenAI as Ai;
use App\Scheduling\SageMakerClient;

class SupportAssistant
{
    public function __construct(private \OpenAI\Client $client, private SageMakerClient $courses)
    {
    }

    public function answer(string $question): string
    {
        $response = $this->client->chat()->create([
            'model' => 'gpt-4o-mini',
            'messages' => [['role' => 'user', 'content' => $question]],
        ]);

        return $response->choices[0]->message->content;
    }

    public function embed(string $text): array
    {
        return Ai::embeddings()->create(['model' => 'text-embedding-3-small', 'input' => $text])->embeddings[0]->embedding;
    }

    public function jobs(): array
    {
        $list = $this->client->fineTuning()->listJobs(['limit' => 10]);
        $this->client->fineTuning()->retrieveJob('ftjob-abc123');
        $this->client->fineTuning()->cancelJob('ftjob-abc123');

        return $list->data;
    }

    public function stage(string $path): string
    {
        return $this->client->files()->upload([
            'purpose' => 'fine-tune',
            'file' => fopen($path, 'r'),
        ])->id;
    }

    public function bookFirstAid(string $site): void
    {
        $this->courses->createTrainingJob(['course' => 'first aid', 'site' => $site]);
    }
}
