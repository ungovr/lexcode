// lexcode-expect: 7
// A post that users write and other users react to: likes, votes or reactions, or an author with
// comments or replies, the way a wall, a forum or a feed stores them (EF Core entities, records and
// plain classes).
using System;
using System.Collections.Generic;

namespace Demo.Social;

public class Post
{
    public int Id { get; set; }
    public string CreatorId { get; set; }
    public string Content { get; set; }
    public int NumberOfLikes { get; set; }
}

public class ForumPost
{
    public int Id { get; set; }
    public int TopicId { get; set; }
    public int CustomerId { get; set; }
    public string Text { get; set; }
    public int VoteCount { get; set; }
}

public class Tweet
{
    private readonly List<string> _likedBy = new();
    public string UserId { get; init; }
    public int RetweetCount => 0;
}

public record WallPost(Guid AuthorId, string Message, IReadOnlyList<string> Reactions);

public class ConversationPost
{
    public Guid Author { get; set; }
    public virtual ICollection<Comment> Comments { get; set; } = new List<Comment>();
}

public class StatusUpdate
{
    public string OwnerId;
    public List<StatusUpdate> Replies = new();
}

public class Comment
{
    public string AuthorId { get; set; }
    public string Body { get; set; }
}
