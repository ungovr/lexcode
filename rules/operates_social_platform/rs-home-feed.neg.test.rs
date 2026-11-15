// lexcode-expect: 0
use diesel::prelude::*;
use uuid::Uuid;

// A feed of the communities a person follows: a notice subscription to a forum, not posts from
// accounts the person follows.
pub fn subscribed(conn: &mut PgConnection, followed_communities: Vec<i32>) -> QueryResult<Vec<i32>> {
    post::table
        .filter(post::community_id.eq_any(followed_communities))
        .select(post::id)
        .load(conn)
}

const COMMUNITY_FEED: &str = "select p.id from community_follower cf join post p on p.community_id = cf.community_id where cf.person_id = $1";

// Hiding the posts of blocked accounts.
pub fn visible(conn: &mut PgConnection, blocked_ids: Vec<i32>) -> QueryResult<Vec<i32>> {
    post::table
        .filter(post::creator_id.ne_all(blocked_ids.clone()))
        .filter(post::creator_id.eq_any(vec![1]))
        .select(post::id)
        .load(conn)
}

// A sales follow-up list: the tasks of the owners due a follow-up, not a feed.
const DUE: &str = "select * from tasks where owner_id in (select user_id from follow_ups where due_at < now())";

// Posts by the staff, and posts joined to their categories.
const STAFF: &str = "select * from posts where author_id in (select id from admins)";
const CATEGORIES: &str = "select p.* from posts p join categories c on c.id = p.category_id";

// In memory: the posts of moderators.
pub fn by_moderators(posts: Vec<Post>, moderators: &[Uuid]) -> Vec<Post> {
    posts.into_iter().filter(|post| moderators.contains(&post.author_id)).collect()
}

pub struct Item {
    pub author_id: Uuid,
}

pub struct Post {
    pub author_id: Uuid,
}
