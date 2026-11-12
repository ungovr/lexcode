<?php
// lexcode-expect: 0
// What is not a post that users react to: a staff blog post with an author and tags only (no one
// else posts or reacts), a postal parcel with an owner, a support ticket with an author and comments
// (a single user writing to staff), and an HTTP POST request class holding replies.
namespace App\Content;

use Illuminate\Database\Eloquent\Model;

class BlogPost
{
    private ?User $author = null;

    private array $tags = [];

    private string $title = '';
}

class Parcel
{
    private ?Customer $owner = null;

    private string $postcode = '';
}

class SupportTicket extends Model
{
    public function author()
    {
        return $this->belongsTo(User::class);
    }

    public function comments()
    {
        return $this->hasMany(TicketComment::class);
    }
}

class HttpPostRequest
{
    private array $replies = [];

    private ?string $user = null;
}

class Reply
{
    private string $text = '';

    private int $statusCode = 200;
}
