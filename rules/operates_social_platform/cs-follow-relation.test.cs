// lexcode-expect: 7
// A follow or friendship between user accounts: an entity holding a follower and the account it
// follows, a friendship or follow entity, and an EF Core query keyed on the follower.
using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.EntityFrameworkCore;

namespace Demo.Social;

public class UserFollow
{
    public Guid FollowerId { get; set; }
    public Guid FolloweeId { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class Account
{
    public ICollection<Account> Followers { get; set; } = new List<Account>();
    public ICollection<Account> Following { get; set; } = new List<Account>();
}

public record Friendship(Guid RequesterId, Guid AddresseeId, bool Accepted);

public class FriendRequest
{
    public Guid FromUserId { get; init; }
    public Guid ToUserId { get; init; }
}

public class FollowService(AppDbContext db)
{
    public Task<bool> IsFollowing(Guid me, Guid them) =>
        db.Follows.AnyAsync(f => f.FollowerId == me && f.FolloweeId == them);

    public int CountFollowing(Guid me) => db.Follows.Count(x => x.FollowerId == me);
}
