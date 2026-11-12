<?php
// lexcode-expect: 5
// A running conversation: the user's turn pushed to a history, then the model's reply pushed back as
// an assistant turn, in a session-backed web chat, a console chat loop, with array_push, with the
// Anthropic SDK's content blocks, and with a decoded HTTP response.
namespace App\Chat;

final class Assistant
{
    public function reply(Request $request)
    {
        $messages = $request->session()->get('chat', []);
        $messages[] = ['role' => 'user', 'content' => $request->input('message')];
        $response = $this->openai->chat()->create(['model' => 'gpt-4o-mini', 'messages' => $messages]);
        $messages[] = ['role' => 'assistant', 'content' => $response->choices[0]->message->content];
        $request->session()->put('chat', $messages);
        return ['reply' => end($messages)['content']];
    }

    public function console(): void
    {
        while (($line = readline('> ')) !== false) {
            $this->history[] = ["role" => "user", "content" => $line];
            $result = $this->openai->chat()->create(['model' => 'gpt-4o-mini', 'messages' => $this->history]);
            $this->history[] = [
                "role" => "assistant",
                "content" => $result->choices[0]->message->content,
            ];
            echo end($this->history)['content'], PHP_EOL;
        }
    }

    public function withArrayPush(string $question): string
    {
        array_push($this->turns, ['role' => 'user', 'content' => $question]);
        $result = $this->openai->chat()->create(['model' => 'gpt-4o-mini', 'messages' => $this->turns]);
        array_push($this->turns, ['role' => 'assistant', 'content' => $result['choices'][0]['message']['content']]);
        return end($this->turns)['content'];
    }

    public function claude(string $question): string
    {
        $this->conversation[] = ['role' => 'user', 'content' => $question];
        $message = $this->anthropic->messages->create(maxTokens: 1024, messages: $this->conversation, model: 'claude-sonnet-4-5');
        $this->conversation[] = ['role' => 'assistant', 'content' => $message->content[0]->text];
        return $message->content[0]->text;
    }

    public function overHttp(string $question): string
    {
        $this->log[] = ['role' => 'user', 'content' => $question];
        $body = Http::withToken($this->key)->post('https://api.openai.com/v1/chat/completions', ['model' => 'gpt-4o-mini', 'messages' => $this->log])->json();
        $this->log[] = ['content' => $body['choices'][0]['message']['content'], 'role' => 'assistant'];
        return end($this->log)['content'];
    }
}
