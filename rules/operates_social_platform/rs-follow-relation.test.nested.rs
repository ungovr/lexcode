// lexcode-expect: 1
use diesel::{dsl::{insert_into}, prelude::*};
use uuid::Uuid;

// Diesel's insert_into reached through a nested use group.
pub fn befriend(conn: &mut PgConnection, a: Uuid, b: Uuid) -> QueryResult<usize> {
    insert_into(friend_requests::table)
        .values((friend_requests::from_id.eq(a), friend_requests::to_id.eq(b)))
        .execute(conn)
}
