// lexcode-expect: 4
use chrono::{DateTime, Utc};
use diesel::prelude::*;
use uuid::Uuid;

// Diesel, as Lemmy writes it: the creator and the recipient of a private message.
#[derive(Clone, Debug, PartialEq)]
#[cfg_attr(feature = "full", derive(Queryable, Selectable, Identifiable))]
#[cfg_attr(feature = "full", diesel(table_name = private_message))]
pub struct PrivateMessage {
    pub id: i32,
    pub creator_id: i32,
    pub recipient_id: i32,
    pub content: String,
    pub published_at: DateTime<Utc>,
}

// sqlx: a direct message between two accounts.
#[derive(Debug, sqlx::FromRow)]
pub struct DirectMessage {
    pub id: Uuid,
    pub sender_id: Uuid,
    pub receiver_id: Uuid,
    pub body: String,
}

// A short name, with the accounts on either side.
pub struct Dm {
    pub from_user: Uuid,
    pub to_user: Uuid,
}

// sqlx: the message is written straight into a direct message table with its recipient.
pub async fn send_dm(pool: &sqlx::PgPool, from: Uuid, to: Uuid, body: &str) -> sqlx::Result<()> {
    sqlx::query(
        "INSERT INTO direct_messages (sender_id, recipient_id, body) VALUES ($1, $2, $3)",
    )
    .bind(from)
    .bind(to)
    .bind(body)
    .execute(pool)
    .await?;
    Ok(())
}
