<?php
// lexcode-expect: 7
// Chat messages mapped to a table: Doctrine entities under the ORM namespace alias, fully qualified,
// under the Entity import and under an alias of it, and Eloquent models extending Model fully
// qualified, under its import and under an alias. The file imports Entity and Model twice, plainly and
// under an alias, so both import shapes are in one fixture.
namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;
use Doctrine\ORM\Mapping\Entity;
use Doctrine\ORM\Mapping\Entity as DoctrineEntity;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Model as Eloquent;

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

#[DoctrineEntity(readOnly: true)]
class ChatLog
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

final class ChatEntry extends Eloquent
{
    protected $guarded = [];
}
