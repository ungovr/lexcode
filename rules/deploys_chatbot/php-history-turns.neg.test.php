<?php
// lexcode-expect: 0
// Prompts built in steps and sent once: a system line and a user line, few-shot examples whose
// assistant turns are fixed text, a model reply saved to a record rather than to the list sent, and
// a reply pushed to one list after the user's turn went to another.
namespace App\Services;

final class Classifier
{
    public function classify(string $text): string
    {
        $messages = [];
        $messages[] = ['role' => 'system', 'content' => 'Label the ticket as billing, bug or other.'];
        $messages[] = ['role' => 'user', 'content' => 'My card was charged twice.'];
        $messages[] = ['role' => 'assistant', 'content' => 'billing'];
        $messages[] = ['role' => 'user', 'content' => $text];
        $response = $this->openai->chat()->create(['model' => 'gpt-4o-mini', 'messages' => $messages]);
        $this->labels->create(['text' => $text, 'label' => $response->choices[0]->message->content]);
        return $response->choices[0]->message->content;
    }

    public function twoLists(string $text): array
    {
        $prompt[] = ['role' => 'user', 'content' => $text];
        $response = $this->openai->chat()->create(['model' => 'gpt-4o-mini', 'messages' => $prompt]);
        $audit[] = ['role' => 'assistant', 'content' => $response->choices[0]->message->content];
        return $audit;
    }
}
