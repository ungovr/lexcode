// lexcode-expect: 13
// A follow or friendship between user accounts: a class holding a follower and the account it
// follows (each member shape C# offers once: a field with and without an initializer, an
// auto-property with get and set, get and init, or get alone, each with and without an
// initializer, and a record's positional parameters), a friendship or follow entity as a class and
// as a record, and EF Core queries over the follow set keyed on the follower.
using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.EntityFrameworkCore;

namespace Demo.Social;

public class Account
{
    private List<Account> _followers;
    private List<Account> _following;
}

public class Profile
{
    private List<Profile> _followers = new();
    private List<Profile> _followings = new();
}

public class Member
{
    public Guid FollowerId { get; set; }
    public Guid FolloweeId { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class Creator
{
    public Guid FollowerUserId { get; init; }
    public Guid FollowedUserId { get; init; }
}

public class Artist
{
    public Guid Follower { get; }
    public Guid Followee { get; }
}

public class Channel
{
    public List<Guid> Followers { get; set; } = new();
    public List<Guid> FollowingIds { get; set; } = new();
}

public class Musician
{
    public List<Guid> Followers { get; init; } = new();
    public List<Guid> Followees { get; init; } = new();
}

public class Writer
{
    public List<Writer> Followers { get; } = new();
    public List<Writer> Following { get; } = new();
}

public record FollowEdge(Guid FollowerId, Guid FollowedId, DateTime Since);

public class Friendship
{
    public Guid RequesterId { get; set; }
    public Guid AddresseeId { get; set; }
    public bool Accepted { get; set; }
}

public record FriendRequest(Guid FromUserId, Guid ToUserId);

public class FollowService(AppDbContext db)
{
    public Task<bool> IsFollowing(Guid me, Guid them) =>
        db.Follows.AnyAsync(f => f.FollowerId == me && f.FolloweeId == them);

    public int CountFollowing(Guid me) => db.UserFollows.Count(x => x.FollowerId == me);
}
