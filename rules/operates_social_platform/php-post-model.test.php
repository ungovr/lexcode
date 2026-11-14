<?php
// lexcode-expect: 5
// Posts that users write and other users react to: a Doctrine post with an author and comments, a
// forum post with an upvote count, an Eloquent post with likes and with an author and replies
// relations, and a promoted reaction count on a status update.
namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;
use Illuminate\Database\Eloquent\Model;

#[ORM\Entity]
class Post
{
    #[ORM\ManyToOne(targetEntity: User::class)]
    private ?User $author = null;

    #[ORM\OneToMany(targetEntity: Comment::class, mappedBy: 'post')]
    private Collection $comments;
}

class ForumPost
{
    private int $upvotes = 0;

    private string $body = '';
}

class WallPost extends Model
{
    public function likes()
    {
        return $this->hasMany(Like::class);
    }

    public function author()
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    public function replies()
    {
        return $this->hasMany(WallPost::class, 'parent_id');
    }
}

final class StatusUpdate
{
    public function __construct(public readonly string $text, public readonly int $reactionCount = 0) {}
}
