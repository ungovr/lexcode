// lexcode-expect: 5
// A feed of the posts written by the accounts a user follows or befriends: a LINQ filter on the
// followed ids, LINQ query syntax joining posts to follows, and raw SQL for the same feed.
using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.EntityFrameworkCore;

namespace Demo.Social;

public class FeedService(AppDbContext db)
{
    public async Task<List<Post>> HomeFeed(Guid me)
    {
        var followingIds = await db.Follows.Where(f => f.FollowerId == me).Select(f => f.FolloweeId).ToListAsync();
        return await db.Posts.Where(p => followingIds.Contains(p.AuthorId)).OrderByDescending(p => p.CreatedAt).ToListAsync();
    }

    public IQueryable<Post> FriendsFeed(Guid me, HashSet<Guid> friendIds) =>
        db.Posts.Where(p => friendIds.Contains(p.UserId));

    public IQueryable<Post> Timeline(Guid me) =>
        from p in db.Posts
        join f in db.Follows on p.AuthorId equals f.FolloweeId
        where f.FollowerId == me
        select p;

    public IQueryable<Post> Raw(Guid me) =>
        db.Posts.FromSqlRaw("SELECT p.* FROM posts p WHERE p.author_id IN (SELECT followee_id FROM follows WHERE follower_id = {0})", me);

    public const string Joined = @"SELECT p.* FROM posts p
        JOIN friendships f ON f.friend_id = p.user_id
        WHERE f.user_id = @me";
}
