// lexcode-expect: 19
// A post that users write and other users react to: likes, votes or reactions, or an author with
// comments or replies, the way a wall, a forum or a feed stores them. Each member shape C# offers
// (a field, with or without an initializer; an auto-property with get and set, get and init, or
// get alone, each with or without an initializer; an expression-bodied property; a record's
// positional parameter) appears once for the reactions, once for the comments and once for the
// author.
using System;
using System.Collections.Generic;

namespace Demo.Social;

// Reactions, one member shape each.
public class Post
{
    private int _likes;
}

public class WallPost
{
    private int _upvotes = 0;
}

public class ForumPost
{
    public int TopicId { get; set; }
    public int CustomerId { get; set; }
    public int VoteCount { get; set; }
}

public class Tweet
{
    public int RetweetCount { get; init; }
}

public class Toot
{
    public int Boosts { get; }
}

public class PhotoPost
{
    public int LikeCount { get; set; } = 0;
}

public class VideoPost
{
    public int ReactionCount { get; init; } = 0;
}

public class LinkPost
{
    public List<Guid> Likes { get; } = [];
}

public class StatusUpdate
{
    public int ShareCount => 0;
}

public record PollPost(Guid AuthorId, string Question, IReadOnlyList<string> Reactions);

// An author and comments or replies, both in the same member shape.
public class Reply
{
    private List<Reply> _replies;
    private Guid _authorId;
}

public class GroupPost
{
    private List<Comment> _comments = new();
    private Guid _ownerId = Guid.Empty;
}

public class QuestionPost
{
    public ICollection<Comment> Comments { get; set; }
    public Guid UserId { get; set; }
}

public class EventPost
{
    public IReadOnlyList<Comment> Comments { get; init; }
    public Guid CreatorId { get; init; }
}

public class AnswerReply
{
    public int CommentCount { get; }
    public Guid PosterId { get; }
}

public class JobBoardPost
{
    public List<Comment> Replies { get; set; } = new();
    public string CreatedBy { get; set; } = "";
}

public class ClubPost
{
    public HashSet<Comment> Comments { get; init; } = new();
    public Guid Author { get; init; } = Guid.Empty;
}

public class MemberPost
{
    public List<Comment> Comments { get; } = new();
    public Guid OwnerId { get; } = Guid.Empty;
}

public record ThreadReply(Guid UserId, Comment[] Replies);

public class Comment
{
    public string AuthorId { get; set; }
    public string Body { get; set; }
}
