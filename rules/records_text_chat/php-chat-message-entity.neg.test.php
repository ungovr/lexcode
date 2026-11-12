<?php
// lexcode-expect: 0
// Not a kept chat: a chat message class with no mapping (a transfer object), a contact message entity,
// a chat room model that holds no text, and chat-named classes on an app's own Model base class and
// an app's own Entity attribute in other namespaces.
namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;
use App\Support\Model;
use App\Attribute\Entity;

final class ChatMessage
{
    public function __construct(public readonly string $role, public readonly string $content)
    {
    }
}

#[ORM\Entity]
class ContactMessage
{
}

class ChatRoom extends \Illuminate\Database\Eloquent\Model
{
}

class ConversationTurn extends Model
{
}

#[Entity]
class ChatTranscript
{
}
