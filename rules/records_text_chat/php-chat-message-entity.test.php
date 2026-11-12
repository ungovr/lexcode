<?php
// lexcode-expect: 5
// Chat messages mapped to a table: Doctrine entities under the ORM namespace alias, fully qualified
// and under the Entity import, and Eloquent models extending Model fully qualified and under its
// import. The aliased imports are in php-chat-message-entity.test.alias.php, because the short-name
// branch steps aside in a file that also imports the class under an alias.
namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;
use Doctrine\ORM\Mapping\Entity;
use Illuminate\Database\Eloquent\Model;

#[ORM\Entity(repositoryClass: ChatMessageRepository::class)]
#[ORM\Table(name: 'chat_message')]
class ChatMessage
{
    #[ORM\Column(type: 'text')]
    private string $body;
}

#[\Doctrine\ORM\Mapping\Entity]
class ConversationTurn
{
}

#[Entity]
class ChatTranscript
{
}

class ChatHistory extends \Illuminate\Database\Eloquent\Model
{
    protected $fillable = ['user_id', 'body'];
}

class ConversationMessage extends Model
{
    protected $fillable = ['conversation_id', 'role', 'content'];
}
