<?php
// lexcode-expect: 11
// What people type in a chat, kept: Eloquent chat-message models (by import and fully qualified), a
// Doctrine entity persisted, a conversation's or thread's messages relation written with the request
// or a Livewire component's message, and chat tables written with Laravel's query builder, Doctrine
// DBAL and a database layer's insert_record.
namespace App\Http\Controllers;

use App\Models\ChatMessage;
use App\Entity\ConversationTurn;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

final class SupportChatController
{
    public function store(Request $request, Conversation $conversation)
    {
        ChatMessage::create(['conversation_id' => $conversation->id, 'body' => $request->input('body')]);
        \App\Models\ChatTranscript::query()->create(['visitor' => $request->ip(), 'text' => $request->input('body')]);
        $this->em->persist(new ConversationTurn($conversation, $request->getPayload()->get('text')));
        $conversation->messages()->create(['user_id' => $request->user()->id, 'body' => $request->input('body')]);
        $thread->messages()->create([
            'sender_id' => auth()->id(),
            'body' => $request->validated('body'),
        ]);
        $chatRoom->messages()->save(new Message(['body' => request('body')]));
        return back();
    }

    public function legacy()
    {
        DB::table('chat_messages')->insert(['room_id' => (int) $_POST['room'], 'body' => $_POST['body']]);
        $this->connection->insert('conversation_turns', ['text' => $_POST['body']]);
        $DB->insert_record('chat_messages', (object) ['message' => $_POST['body']]);
        ChatMessage::insert([['body' => 'Hi'], ['body' => 'Hello']]);
    }
}

final class ChatBox extends Component
{
    public function send(): void
    {
        $this->conversation->messages()->create(['user_id' => auth()->id(), 'body' => $this->newMessage]);
        $this->reset('newMessage');
    }
}
