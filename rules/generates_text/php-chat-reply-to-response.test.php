<?php
// lexcode-expect: 10
// Model-written text sent back to the person who asked: Laravel and Symfony controllers, plain
// PHP, a broadcast and a Livewire component. The facades appear through an aliased import and
// fully qualified.

namespace App\Http\Controllers;

use Anthropic\Client as AnthropicClient;
use Anthropic\Laravel\Facades\Anthropic as Claude;
use App\Events\ReplyWritten;
use App\Models\Message;
use Illuminate\Http\Request;
use OpenAI\Laravel\Facades\OpenAI as LLM;
use Prism\Prism\Facades\Prism as PrismAI;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;

class AssistantController extends Controller
{
    // openai-php/laravel through an alias: the reply is the JSON response.
    public function ask(Request $request)
    {
        $result = LLM::chat()->create([
            'model' => 'gpt-4o-mini',
            'messages' => [['role' => 'user', 'content' => $request->input('q')]],
        ]);
        return response()->json(['answer' => $result->choices[0]->message->content]);
    }

    // The same facade fully qualified, with no import: the reply is the view's data.
    public function summary(Request $request)
    {
        $result = \OpenAI\Laravel\Facades\OpenAI::responses()->create(['model' => 'gpt-4.1', 'input' => $request->input('text')]);
        return view('summary', ['summary' => $result->outputText]);
    }

    // Streamed: each chunk is echoed to the browser.
    public function stream(Request $request)
    {
        $stream = LLM::chat()->createStreamed(['model' => 'gpt-4o-mini', 'messages' => [['role' => 'user', 'content' => $request->input('q')]]]);
        foreach ($stream as $chunk) {
            echo $chunk->choices[0]->delta->content;
        }
    }

    // anthropic-php/laravel through an alias, and fully qualified.
    public function claude(Request $request)
    {
        $message = Claude::messages()->create(['model' => 'claude-sonnet-4-5', 'max_tokens' => 1024, 'messages' => [['role' => 'user', 'content' => $request->input('q')]]]);
        return $message->content[0]->text;
    }

    public function claudeQualified(Request $request): array
    {
        $message = \Anthropic\Laravel\Facades\Anthropic::messages()->create(['model' => 'claude-haiku-4-5', 'max_tokens' => 256, 'messages' => []]);
        return ['reply' => $message->content[0]->text];
    }

    // Prism through an alias, and fully qualified; the text is broadcast to the thread.
    public function prism(Request $request)
    {
        $response = PrismAI::text()->using('anthropic', 'claude-sonnet-4-5')->withPrompt($request->input('q'))->asText();
        return response($response->text);
    }

    public function prismBroadcast(Request $request, Message $message)
    {
        $response = \Prism\Prism\Prism::text()
            ->using('openai', 'gpt-4o')
            ->withPrompt($request->input('q'))
            ->asText();
        $message->update(['body' => $response->text]);
        broadcast(new ReplyWritten($message));
    }
}

class DraftController extends AbstractController
{
    public function __construct(private AnthropicClient $anthropic, private $openai)
    {
    }

    // The official Anthropic SDK: the draft is rendered into a Twig template.
    public function draft(Request $request)
    {
        $message = $this->anthropic->messages->create(
            maxTokens: 1024,
            messages: [['role' => 'user', 'content' => $request->get('topic')]],
            model: 'claude-sonnet-4-5',
        );
        return $this->render('draft/show.html.twig', ['draft' => $message->content[0]->text]);
    }

    // openai-php on a client object: a Symfony JSON response.
    public function title(Request $request): JsonResponse
    {
        $result = $this->openai->chat()->create(['model' => 'gpt-4o-mini', 'messages' => [['role' => 'user', 'content' => $request->get('body')]]]);
        return new JsonResponse(['title' => $result->choices[0]->message->content]);
    }

    // AWS Bedrock: the Converse API.
    public function bedrock(Request $request, $bedrock)
    {
        $result = $bedrock->converse([
            'modelId' => 'anthropic.claude-3-5-sonnet-20240620-v1:0',
            'messages' => [['role' => 'user', 'content' => [['text' => $request->get('q')]]]],
        ]);
        return $this->json(['text' => $result['output']['message']['content'][0]['text']]);
    }
}
