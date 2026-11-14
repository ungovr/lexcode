<?php
// lexcode-expect: 0
// Model calls with no conversation, and conversations that reach no model: single-shot summarization
// of one typed text, a batch job over stored tickets, the request's messages stored as a record or
// handed to a notifier, a messages list posted to a chat webhook that is not a model, a static FAQ,
// and flash messages.
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use OpenAI\Laravel\Facades\OpenAI;

final class SummaryController
{
    public function summarize(Request $request)
    {
        $reply = OpenAI::chat()->create([
            'model' => 'gpt-4o-mini',
            'messages' => [
                ['role' => 'system', 'content' => 'Summarize the text in one paragraph.'],
                ['role' => 'user', 'content' => $request->input('text')],
            ],
        ]);
        return ['summary' => $reply->choices[0]->message->content];
    }

    public function ask(Request $request)
    {
        return OpenAI::chat()->create(['model' => 'gpt-4o-mini', 'messages' => [['role' => 'user', 'content' => $request->input('message')]]]);
    }

    public function labelTickets()
    {
        foreach (Ticket::unlabeled()->get() as $ticket) {
            $ticket->update(['label' => $this->openai->chat()->create(['model' => 'gpt-4o-mini', 'messages' => $this->promptFor($ticket)])]);
        }
    }

    public function archive(Request $request)
    {
        $this->conversations->create(['title' => $request->input('title'), 'messages' => $request->input('messages')]);
        $this->notifier->create(['channel' => 'support', 'messages' => $request->input('messages')]);
        Http::post('https://hooks.slack.com/services/T000/B000/XXXX', ['messages' => $request->input('messages')]);
        session()->flash('messages', $request->input('messages'));
        return back();
    }

    public function faq()
    {
        return view('faq', ['messages' => $this->faq->all()]);
    }
}
