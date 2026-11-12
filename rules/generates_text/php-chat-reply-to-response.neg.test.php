<?php
// lexcode-expect: 0
// Text a model writes that only the team reads, text a person wrote, and app classes that share
// a short name with a model library's facade.

namespace App\Console\Commands;

use App\Models\Thread;
use App\Support\Anthropic;
use App\Support\OpenAI;
use App\Support\Prism;
use Illuminate\Console\Command;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

// php artisan notes:draft: a maintainer drafts release notes and reads them in the terminal.
class DraftReleaseNotes extends Command
{
    protected $signature = 'notes:draft {tag}';

    public function handle()
    {
        $client = \OpenAI::client(env('OPENAI_API_KEY'));
        $result = $client->chat()->create(['model' => 'gpt-4o-mini', 'messages' => [['role' => 'user', 'content' => 'Draft notes for ' . $this->argument('tag')]]]);
        $draft = $result->choices[0]->message->content;
        file_put_contents(storage_path('notes-draft.md'), $draft);
        $this->info($draft);
        echo $draft . PHP_EOL;
        return 0;
    }
}

// A nightly job summarizes support tickets into the log the support team reads.
class SummarizeTickets
{
    public function handle($client)
    {
        $summary = $client->messages->create(maxTokens: 512, messages: [['role' => 'user', 'content' => 'Summarize today']], model: 'claude-sonnet-4-5');
        Log::info('ticket summary', ['text' => $summary->content[0]->text]);
    }
}

class ThreadController extends Controller
{
    // A message a person wrote, stored and sent back: no model is involved.
    public function store(Request $request, Thread $thread)
    {
        $message = $thread->messages()->create(['body' => $request->input('body'), 'user_id' => $request->user()->id]);
        return response()->json($message);
    }

    // Formatting and spell-checking what a person wrote is not generating it.
    public function preview(Request $request)
    {
        $html = Str::markdown($request->input('body'));
        $words = array_filter(explode(' ', $request->input('body')), fn ($w) => !pspell_check(pspell_new('en'), $w));
        return response()->json(['html' => $html, 'misspelled' => array_values($words)]);
    }

    // An app's own classes named OpenAI, Anthropic and Prism, in the app's namespace.
    public function own(Request $request)
    {
        $a = OpenAI::chat()->create(['model' => 'house-style', 'messages' => [$request->input('q')]]);
        $b = Anthropic::messages()->create(['max_tokens' => 10, 'model' => 'house-style']);
        $c = Prism::text()->using('house', 'style')->withPrompt($request->input('q'))->asText();
        return response()->json(['a' => $a, 'b' => $b, 'c' => $c->text]);
    }

    // A chat relation on the app's own model, created without a model name.
    public function open(Request $request)
    {
        $chat = $request->user()->chat()->create(['title' => $request->input('title')]);
        return response()->json($chat);
    }

    // A private helper's value is not a response.
    private function draftFor(string $topic, $client): string
    {
        $result = $client->chat()->create(['model' => 'gpt-4o-mini', 'messages' => [['role' => 'user', 'content' => $topic]]]);
        return $result->choices[0]->message->content;
    }
}
