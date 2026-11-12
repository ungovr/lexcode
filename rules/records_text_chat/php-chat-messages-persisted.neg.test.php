<?php
// lexcode-expect: 0
// Not a kept chat: a contact form and a feedback form the app only saves, a support ticket, a chat
// room record that holds no text, a bare Message model and a bare Conversation model written outside
// a chat, a conversation's messages relation written by the app with no typed text, and inserts into
// tables not named for chat.
namespace App\Http\Controllers;

use App\Models\ContactMessage;
use App\Models\ChatRoom;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

final class ContactController
{
    public function store(Request $request)
    {
        ContactMessage::create($request->validated());
        Feedback::create(['rating' => $request->input('rating'), 'comment' => $request->input('comment')]);
        Ticket::create(['subject' => $request->input('subject'), 'body' => $request->input('body')]);
        ChatRoom::create(['name' => $request->input('name')]);
        Message::create(['subject' => 'Your order shipped', 'user_id' => $request->user()->id]);
        Conversation::create(['subject' => $request->input('subject')]);
        $conversation->messages()->create(['body' => 'This conversation was closed.']);
        DB::table('contact_requests')->insert(['email' => $request->input('email')]);
        $this->connection->insert('audit_log', ['event' => 'contact']);
        return back();
    }
}
