// lexcode-expect: 0
use chrono::{DateTime, Utc};
use uuid::Uuid;

// The definition's exclusion: a user writes to the app's staff. A contact message has a sender
// and no other user as its recipient.
#[derive(Debug, sqlx::FromRow)]
pub struct ContactMessage {
    pub id: Uuid,
    pub sender_email: String,
    pub body: String,
}

// An email the app sends: a sender and a recipient, but from the app to a person, not from one
// account to another.
#[derive(Debug)]
pub struct EmailMessage {
    pub sender: String,
    pub recipient: String,
    pub subject: String,
}

// A notification with a recipient, sent by the app itself.
pub struct NotificationMessage {
    pub recipient_id: Uuid,
    pub sender_id: Uuid,
}

// A queue message between two services, named like a chat message.
pub struct QueueChatMessage {
    pub sender: String,
    pub receiver: String,
}

// A Diesel insert form beside a private message: the same message type, read once on the struct.
pub struct PrivateMessageInsertForm {
    pub creator_id: i32,
    pub recipient_id: i32,
}

// A direct message type with only a recipient: a broadcast the staff send.
pub struct DirectMessage {
    pub recipient_id: Uuid,
    pub body: String,
    pub sent_at: DateTime<Utc>,
}

// An insert into a support message table whose recipient is the support team (a user writing to
// the staff), and an insert into a mail log.
pub async fn store(pool: &sqlx::PgPool, user: Uuid, body: &str) -> sqlx::Result<()> {
    sqlx::query("insert into support_chat_messages (user_id, recipient, body) values ($1, 'support', $2)")
        .bind(user)
        .bind(body)
        .execute(pool)
        .await?;
    sqlx::query("insert into email_log (recipient, subject) values ($1, $2)")
        .bind("a@example.org")
        .bind(body)
        .execute(pool)
        .await?;
    // A shop order with a gift recipient: a recipient column on a table that holds no messages.
    sqlx::query("insert into gift_orders (customer_id, recipient, address) values ($1, $2, $3)")
        .bind(user)
        .bind("A. Person")
        .bind(body)
        .execute(pool)
        .await?;
    Ok(())
}
