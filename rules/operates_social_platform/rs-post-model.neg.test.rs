// lexcode-expect: 0
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

// The definition's exclusion: a user can leave a comment for the app's staff to read. Nothing
// here is a post other users see or react to.
#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct Feedback {
    pub id: Uuid,
    pub user_id: Uuid,
    pub comment: String,
    pub created_at: DateTime<Utc>,
}

// A post with an author and a single text field named comments (an editor's note on the
// entry), not replies from other users.
#[derive(Debug, sqlx::FromRow)]
pub struct BlogPost {
    pub id: Uuid,
    pub author_id: Uuid,
    pub title: String,
    pub comments: String,
}

// A post with an author and no reactions or replies at all: an announcement the staff publish.
#[derive(Debug, sqlx::FromRow)]
pub struct Post {
    pub id: Uuid,
    pub author: String,
    pub body: String,
}

// A support desk's canned reply: the alternative texts an agent can send, with no author.
pub struct CannedReply {
    pub id: Uuid,
    pub title: String,
    pub replies: Vec<String>,
}

// Likes on something that is not a post: a product in a shop.
#[derive(Debug, sqlx::FromRow)]
pub struct Product {
    pub id: Uuid,
    pub owner_id: Uuid,
    pub likes: i64,
    pub comments: Vec<String>,
}

// A name that only ends in the letters: a remote station with its votes, not a post.
pub struct Outpost {
    pub owner_id: Uuid,
    pub upvotes: i32,
}

// Local variables named for reactions, outside any struct.
pub fn tally(post_id: Uuid) -> i64 {
    let upvotes: i64 = 3;
    let comments: Vec<String> = Vec::new();
    upvotes + comments.len() as i64 + post_id.as_u128() as i64
}
