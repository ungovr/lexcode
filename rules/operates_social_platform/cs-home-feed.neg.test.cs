// lexcode-expect: 0
// Not a feed of other users' posts: a user's own posts, orders filtered by a list of product ids,
// tickets due for a follow-up, and SQL that lists a user's own posts and the support follow-ups.
using System;
using System.Collections.Generic;
using System.Linq;

namespace Demo.Shop;

public class Queries
{
    public List<Post> Mine(IQueryable<Post> posts, Guid me) =>
        posts.Where(p => p.AuthorId == me).OrderByDescending(p => p.CreatedAt).ToList();

    public List<Order> ForProducts(IQueryable<Order> orders, List<int> productIds) =>
        orders.Where(o => productIds.Contains(o.ProductId)).ToList();

    public List<Ticket> FollowUps(IQueryable<Ticket> tickets, List<Guid> followUpIds) =>
        tickets.Where(t => followUpIds.Contains(t.OwnerId)).ToList();

    public const string MyPosts = "SELECT * FROM posts WHERE author_id = @me ORDER BY created_at DESC";

    public const string Due = "SELECT * FROM tickets t JOIN follow_ups f ON f.ticket_id = t.id WHERE t.user_id IN (SELECT id FROM follow_up_owners)";
}
