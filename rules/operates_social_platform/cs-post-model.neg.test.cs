// lexcode-expect: 0
// Not a user post other users react to: a staff-written blog post with comments switched on, a
// comment left for staff to read, an order with notes, a post-office address with a likes field,
// a plain post with no reactions or replies, a news post with comments but no author, a review
// post with an author but no comments, and a job posting with a vote count.
using System;
using System.Collections.Generic;

namespace Demo.Content;

public class BlogPost
{
    public int Id { get; set; }
    public string Author { get; set; }
    public string Title { get; set; }
    public string Body { get; set; }
    public bool AllowComments { get; set; }
}

public class FeedbackComment
{
    public int Id { get; set; }
    public string UserId { get; set; }
    public string Comments { get; set; }
}

public class Order
{
    public int Id { get; set; }
    public string OwnerId { get; set; }
    public List<string> Comments { get; set; } = new();
}

public class PostalAddress
{
    public string UserId { get; set; }
    public string PostCode { get; set; }
    public int Likes;
}

public class Post
{
    public string Title { get; init; }
    public string Body { get; init; }
}

public record NewsPost(string Title, string Body, IReadOnlyList<string> Comments);

public class ReviewPost
{
    public string AuthorId { get; set; }
    public string Body { get; set; }
}

public class JobPosting
{
    public string CreatedBy { get; set; }
    public int VoteCount { get; set; }
    public List<string> Replies { get; } = new();
}
