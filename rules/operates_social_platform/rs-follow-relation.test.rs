// lexcode-expect: 9
use diesel::{insert_into, prelude::*};
use diesel as d;
use uuid::Uuid;

// A struct that is the follow itself, with the follower and the account it follows.
#[derive(Debug, Queryable, Insertable)]
#[diesel(table_name = follows)]
pub struct Follow {
    pub follower_id: Uuid,
    pub followed_id: Uuid,
}

// A relationship struct named for neither, holding the follower and the followee.
#[derive(Debug, sqlx::FromRow)]
pub struct Relationship {
    pub follower_id: Uuid,
    pub followee_id: Uuid,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

// Lemmy's form for one person following another.
#[derive(Clone)]
#[cfg_attr(feature = "full", derive(Insertable, AsChangeset))]
#[cfg_attr(feature = "full", diesel(table_name = person_actions))]
pub struct PersonFollowerForm {
    pub target_id: i32,
    pub person_id: i32,
    pub follow_pending: bool,
}

// A friendship between two users.
pub struct Friendship {
    pub user_id: Uuid,
    pub friend_id: Uuid,
}

// An account's followers and following lists.
pub struct Profile {
    pub followers: Vec<Uuid>,
    pub following: Vec<Uuid>,
}

// sqlx: the follow row is written with an SQL insert, as the RealWorld example app does.
pub async fn follow_user(pool: &sqlx::PgPool, me: Uuid, them: Uuid) -> sqlx::Result<()> {
    sqlx::query(
        "insert into follow(following_user_id, followed_user_id) values ($1, $2) \
         on conflict do nothing",
    )
    .bind(me)
    .bind(them)
    .execute(pool)
    .await?;
    Ok(())
}

// Diesel: an insert into the follows table by its full path, through a grouped use and under
// an alias of the crate.
pub fn follow(conn: &mut PgConnection, f: &Follow) -> QueryResult<usize> {
    diesel::insert_into(follows::table).values(f).execute(conn)?;
    insert_into(user_follows::table).values(f).execute(conn)?;
    d::insert_into(friendships::table).values(f).execute(conn)
}
