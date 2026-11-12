<?php
// lexcode-expect: 2
// Chat messages mapped to a table through aliased imports: a Doctrine entity under an alias of the
// Entity attribute, and an Eloquent model extending an alias of Model.
namespace App\Entity;

use Doctrine\ORM\Mapping\Entity as DoctrineEntity;
use Illuminate\Database\Eloquent\Model as Eloquent;

#[DoctrineEntity(readOnly: true)]
class ChatLog
{
}

final class ChatEntry extends Eloquent
{
    protected $guarded = [];
}
