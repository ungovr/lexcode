// lexcode-expect: 7
use diesel::prelude::*;
use sea_orm::{entity::prelude::*, QueryFilter};
use uuid::Uuid;

// sqlx: posts whose author is in the set the user follows.
pub async fn home(pool: &sqlx::PgPool, me: Uuid) -> sqlx::Result<Vec<(Uuid, String)>> {
    sqlx::query_as(
        "SELECT id, body FROM posts WHERE author_id IN \
         (SELECT followed_id FROM follows WHERE follower_id = $1) ORDER BY created_at DESC",
    )
    .bind(me)
    .fetch_all(pool)
    .await
}

// SQL text: posts joined to the follow table on the author.
const TIMELINE: &str = r#"
    select p.id, p.body
    from posts p
    join follows f on f.followed_id = p.author_id
    where f.follower_id = $1
"#;

// SQL text the other way round, as the RealWorld example app writes its feed: the follow table
// first, joined to the articles of the accounts followed.
const FEED: &str = r#"
    select slug, title
    from follow
    inner join article on followed_user_id = article.user_id
    where following_user_id = $1
"#;

// SQL text: posts by the user's friends.
const FRIENDS: &str = "select * from statuses s where s.user_id in (select friend_id from friendships where user_id = $1)";

// Diesel: the post's author in the ids the user follows.
pub fn feed(conn: &mut PgConnection, following_ids: Vec<i32>) -> QueryResult<Vec<i32>> {
    posts::table
        .filter(posts::author_id.eq_any(following_ids))
        .select(posts::id)
        .load(conn)
}

// SeaORM: the same with is_in.
pub fn feed_query(followed: Vec<Uuid>) -> Select<post::Entity> {
    post::Entity::find().filter(post::Column::AuthorId.is_in(followed))
}

// In memory: keep the posts written by followed accounts.
pub fn keep(posts: Vec<Post>, followees: &std::collections::HashSet<Uuid>) -> Vec<Post> {
    posts.into_iter().filter(|post| followees.contains(&post.author_id)).collect()
}

pub struct Post {
    pub author_id: Uuid,
}
