<?php
// lexcode-expect: 0
// Doctrine's Entity attribute and Eloquent's Model imported under aliases, and the app's own Entity
// attribute and Model base class used by the short names. The engine's `use X;` also matches
// `use X as Y;`, so the short-name branches have to step aside where the class is aliased.
namespace App\Chat;

use App\Attribute\Entity;
use App\Support\Model;
use Doctrine\ORM\Mapping\Entity as DoctrineEntity;
use Illuminate\Database\Eloquent\Model as Eloquent;

#[Entity]
class ChatTranscript
{
}

class ConversationMessage extends Model
{
    protected array $fields = ['conversation_id', 'role', 'content'];
}
