<?php
// lexcode-expect: 5
// An assistant's conversation kept turn by turn: the user's message and the model's reply each stored
// with their role, through a conversation's messages relation, on a Message model fully qualified and
// imported, and through query().
namespace App\Http\Controllers;

use App\Models\Message;
use OpenAI\Laravel\Facades\OpenAI;

final class AssistantController
{
    public function ask(Request $request, Conversation $conversation)
    {
        $conversation->messages()->create(['role' => 'user', 'content' => $request->input('message')]);
        $reply = OpenAI::chat()->create(['model' => 'gpt-4o-mini', 'messages' => $conversation->transcript()]);
        $conversation->messages()->create([
            'role' => 'assistant',
            'content' => $reply->choices[0]->message->content,
        ]);
        return back();
    }

    public function viaModel(Request $request)
    {
        Message::create(['chat_id' => $request->input('chat'), 'role' => "user", 'body' => $request->input('message')]);
        \App\Models\ChatTurn::create(['chat_id' => $request->input('chat'), 'role' => 'assistant', 'body' => $this->answer()]);
        Message::query()->create(['chat_id' => $request->input('chat'), 'role' => 'bot', 'body' => $this->answer()]);
    }
}
