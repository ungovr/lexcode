<?php
// lexcode-expect: 5
// Messages from one account to another: a Doctrine direct-message entity with a sender and a
// recipient, a chat message with promoted constructor properties, an Eloquent Message model that
// relates the sender's and the receiver's accounts, and Laravel broadcast channels for a user's
// chat and conversations (aliased facade and fully qualified).
namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Broadcast as Channels;

#[ORM\Entity]
class DirectMessage
{
    #[ORM\ManyToOne(targetEntity: User::class)]
    private ?User $sender = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false)]
    private ?User $recipient = null;

    private ?string $body = null;
}

final class ChatMessage
{
    public function __construct(
        public readonly int $senderId,
        public readonly int $receiverId,
        public readonly string $text,
    ) {}
}

class Message extends Model
{
    protected $fillable = ['sender_id', 'receiver_id', 'body'];

    public function sender()
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    public function receiver()
    {
        return $this->belongsTo(User::class, 'receiver_id');
    }
}

class ChannelRoutes
{
    public static function register(): void
    {
        Channels::channel('chat.{receiverId}', function ($user, $receiverId) {
            return (int) $user->id === (int) $receiverId;
        });
        \Illuminate\Support\Facades\Broadcast::channel(
            'conversation.{conversationId}',
            fn ($user, $conversationId) => $user->conversations()->whereKey($conversationId)->exists(),
        );
    }
}
