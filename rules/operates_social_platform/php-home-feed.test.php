<?php
// lexcode-expect: 6
// A home feed of posts by the accounts a user follows or befriends: an Eloquent whereIn on the
// followed accounts (static, on a builder, and orWhereIn), a Doctrine query-builder IN on the following list,
// a DQL condition, and raw SQL joining posts to the follows table.
namespace App\Feed;

use Doctrine\ORM\EntityManagerInterface;

class TimelineService
{
    public function home(User $user)
    {
        $ids = $user->following()->pluck('users.id');
        $posts = Post::whereIn('user_id', $user->following()->pluck('users.id'))->latest()->get();
        $more = $this->posts->query()
            ->whereIn('author_id', $user->friends->pluck('id'))
            ->get();
        $either = Post::where('pinned', true)
            ->orWhereIn('user_id', $user->following()->pluck('id'))
            ->get();
        return [$ids, $posts, $more, $either];
    }

    public function doctrine(EntityManagerInterface $em, Account $me)
    {
        $qb = $em->createQueryBuilder();
        $qb->select('p')->from(Post::class, 'p')
            ->where($qb->expr()->in('p.author', ':following'))
            ->setParameter('following', $me->getFollowing());
        $dql = $em->createQuery('SELECT p FROM App\Entity\Post p WHERE p.author IN (:followedAccounts) ORDER BY p.publishedAt DESC');
        return [$qb->getQuery()->getResult(), $dql->getResult()];
    }

    public function sql(\PDO $pdo, int $me)
    {
        $stmt = $pdo->prepare("SELECT posts.* FROM posts
            JOIN follows ON follows.followed_id = posts.user_id
            WHERE follows.follower_id = ?");
        $stmt->execute([$me]);
        return $stmt->fetchAll();
    }
}
