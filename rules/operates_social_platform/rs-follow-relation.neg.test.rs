// lexcode-expect: 0
use diesel::prelude::*;
use uuid::Uuid;

// Following a community or a topic is a notice subscription, not a link between two accounts.
#[derive(Clone)]
#[cfg_attr(feature = "full", derive(Insertable, AsChangeset))]
#[cfg_attr(feature = "full", diesel(table_name = community_actions))]
pub struct CommunityFollowerForm {
    pub community_id: i32,
    pub person_id: i32,
    pub follow_state: i32,
}

pub struct TopicSubscription {
    pub follower_id: Uuid,
    pub topic_id: Uuid,
}

// A game camera that follows the player: a following flag with no follower.
pub struct CameraSettings {
    pub following: bool,
    pub zoom: f32,
}

// A follow-up on a sales lead: the word, not the relation.
pub struct FollowUp {
    pub lead_id: Uuid,
    pub followed_up_at: chrono::DateTime<chrono::Utc>,
}

// SQL writes into a topic's watcher table and a follow-up table.
pub async fn watch(pool: &sqlx::PgPool, user: Uuid, topic: Uuid) -> sqlx::Result<()> {
    sqlx::query("insert into topic_followers (topic_id, follower_id) values ($1, $2)")
        .bind(topic)
        .bind(user)
        .execute(pool)
        .await?;
    sqlx::query("insert into follow_ups (lead_id, followed_by) values ($1, $2)")
        .bind(topic)
        .bind(user)
        .execute(pool)
        .await?;
    Ok(())
}

// Diesel inserting into a table of the watchers of a thread.
pub fn watch_thread(conn: &mut PgConnection, f: &(i32, i32)) -> QueryResult<usize> {
    diesel::insert_into(thread_followers::table).values(f).execute(conn)
}
