<?php
// lexcode-expect: 9
// Follow and friendship relations between accounts: a Doctrine follow entity (follower and
// followed), an account's followers and following collections, Eloquent followers and friends
// relations, a Friendship model, the overtrue/laravel-follow trait (aliased) and the
// multicaret/laravel-acquaintances trait (fully qualified), and finders keyed on the follower.
namespace App\Models;

use Doctrine\ORM\Mapping as ORM;
use Illuminate\Database\Eloquent\Model;
use Overtrue\LaravelFollow\Traits\Follower as CanFollow;

#[ORM\Entity]
class Subscription
{
    #[ORM\ManyToOne(targetEntity: Account::class)]
    private ?Account $follower = null;

    #[ORM\ManyToOne(targetEntity: Account::class)]
    private ?Account $followed = null;
}

#[ORM\Entity]
class Account
{
    #[ORM\ManyToMany(targetEntity: self::class, mappedBy: 'following')]
    private Collection $followers;

    #[ORM\ManyToMany(targetEntity: self::class, inversedBy: 'followers')]
    private Collection $following;
}

class User extends Model
{
    use HasFactory, CanFollow;

    public function followers()
    {
        return $this->belongsToMany(User::class, 'follows', 'followed_id', 'follower_id');
    }

    public function friends()
    {
        return $this->belongsToMany(User::class, 'friendships', 'user_id', 'friend_id')
            ->wherePivot('accepted', true);
    }
}

class Friendship extends Model
{
    protected $fillable = ['user_id', 'friend_id', 'accepted'];
}

class Member extends Model
{
    use \Multicaret\Acquaintances\Traits\Friendable;
}

class FollowQueries
{
    public function followedBy(int $userId, FollowRepository $follows)
    {
        $rows = Follow::where('follower_id', $userId)->pluck('followed_id');
        $mine = $follows->findBy(['follower' => $this->user]);
        return [$rows, $mine];
    }
}
