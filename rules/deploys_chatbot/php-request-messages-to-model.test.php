<?php
// lexcode-expect: 16
// Endpoints that hand the conversation a person sent to a language model: openai-php and its Laravel
// facade, the Anthropic SDK with named arguments, the Responses API, Prism, Gemini's startChat, and a
// model endpoint posted to with Laravel's Http client and Guzzle; the request read with input(),
// json(), validated(), getPayload(), a property, the request() helper, a decoded body and $_POST,
// in place or through a local variable.
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use OpenAI\Laravel\Facades\OpenAI;
use Prism\Prism\Prism;

final class ChatController
{
    public function laravel(Request $request)
    {
        $reply = OpenAI::chat()->create(['model' => 'gpt-4o-mini', 'messages' => $request->input('messages')]);
        return ['reply' => $reply->choices[0]->message->content];
    }

    public function withSystem(Request $request)
    {
        $reply = $this->openai->chat()->create([
            'model' => 'gpt-4o-mini',
            'messages' => [
                ['role' => 'system', 'content' => 'You are the help desk assistant.'],
                ...$request->input('messages'),
            ],
        ]);
        return ['reply' => $reply->choices[0]->message->content];
    }

    public function merged(Request $request)
    {
        $reply = $this->openai->chat()->create(['model' => 'gpt-4o-mini', 'messages' => array_merge([$this->system], $request->json('history'))]);
        return ['reply' => $reply->choices[0]->message->content];
    }

    public function anthropic(Request $request)
    {
        $message = $this->anthropic->messages->create(
            maxTokens: 1024,
            messages: $request->validated('messages'),
            model: 'claude-sonnet-4-5',
        );
        return ['reply' => $message->content[0]->text];
    }

    public function symfonyPayload(SymfonyRequest $request)
    {
        $reply = $this->client->chat()->create(['model' => 'gpt-4o-mini', 'messages' => $request->getPayload()->all('messages')]);
        $again = $this->client->chat()->create(['model' => 'gpt-4o-mini', 'messages' => $request->request->all('history')]);
        return new JsonResponse(['reply' => $reply->choices[0]->message->content, 'again' => $again->id]);
    }

    public function property(Request $request)
    {
        return OpenAI::chat()->create(['model' => 'gpt-4o-mini', 'messages' => $request->messages]);
    }

    public function responses(Request $request)
    {
        return $this->openai->responses()->create(['model' => 'gpt-4.1', 'input' => $request->input('conversation')]);
    }

    public function prism(Request $request)
    {
        return Prism::text()
            ->using('openai', 'gpt-4o-mini')
            ->withMessages(array_map(fn ($m) => new UserMessage($m['text']), $request->input('messages')))
            ->asText();
    }

    public function gemini(Request $request)
    {
        $chat = $this->gemini->generativeModel('gemini-2.0-flash')->startChat(history: $request->input('history'));
        return $chat->sendMessage($request->input('message'))->text();
    }

    public function viaHttp(Request $request)
    {
        return Http::withToken(config('services.openai.key'))
            ->post('https://api.openai.com/v1/chat/completions', ['model' => 'gpt-4o-mini', 'messages' => $request->input('messages')])
            ->json('choices.0.message.content');
    }

    public function viaGuzzle(SymfonyRequest $request)
    {
        $data = json_decode($request->getContent(), true);
        $response = $this->http->post('https://api.anthropic.com/v1/messages', [
            'json' => ['model' => 'claude-sonnet-4-5', 'max_tokens' => 1024, 'messages' => $data['messages']],
        ]);
        return new JsonResponse(json_decode((string) $response->getBody(), true));
    }

    public function plain()
    {
        return $this->openai->chat()->create(['model' => 'gpt-4o-mini', 'messages' => $_POST['messages']]);
    }

    public function local(Request $request)
    {
        $history = $request->input('history');
        $reply = $this->openai->chat()->create(['model' => 'gpt-4o-mini', 'messages' => $history]);
        return ['reply' => $reply->choices[0]->message->content];
    }

    public function helper()
    {
        $messages = request('messages');
        return OpenAI::chat()->create(['model' => 'gpt-4o-mini', 'messages' => $messages]);
    }

    public function helperInPlace()
    {
        return OpenAI::chat()->create(['model' => 'gpt-4o-mini', 'messages' => request()->input('messages')]);
    }
}
