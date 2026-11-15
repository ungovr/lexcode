// lexcode-expect: 5
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

// Diesel, with its derives behind a feature: votes and a comment count on the post.
#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
#[cfg_attr(feature = "full", derive(Queryable, Selectable, Identifiable))]
#[cfg_attr(feature = "full", diesel(table_name = post))]
pub struct Post {
    pub id: i32,
    pub name: String,
    pub creator_id: i32,
    pub comments: i32,
    pub upvotes: i32,
    pub downvotes: i32,
}

// sqlx: a forum post with its author and the replies under it.
#[derive(Debug, sqlx::FromRow)]
pub struct ForumPost {
    pub id: Uuid,
    pub author_id: Uuid,
    pub body: String,
    pub replies: Vec<Uuid>,
}

// A plain struct: a like count.
pub struct Tweet {
    pub id: i64,
    pub text: String,
    pub like_count: i64,
}

// Reactions held as a list.
pub(crate) struct StatusUpdate {
    pub(crate) id: Uuid,
    pub(crate) reactions: Vec<String>,
    pub(crate) published_at: DateTime<Utc>,
}

// A reply with its author and a count of the replies under it.
#[derive(Debug)]
pub struct CommentReply {
    pub user_id: Uuid,
    pub reply_count: Option<i32>,
}
