// lexcode-expect: 0
use diesel::{insert_into, prelude::*};
use sqlx::PgPool;

// A form the app only saves: a contact message, feedback and a ticket.
pub async fn contact(pool: &PgPool, name: &str, body: &str) -> sqlx::Result<()> {
    sqlx::query!("INSERT INTO contact_messages (name, body) VALUES ($1, $2)", name, body)
        .execute(pool)
        .await?;
    sqlx::query("INSERT INTO feedback (body) VALUES ($1)")
        .bind(body)
        .execute(pool)
        .await?;
    Ok(())
}

// A chat room or channel holds no text; a user-to-user inbox is read by the social rules.
pub async fn rooms(pool: &PgPool, name: &str, body: &str) -> sqlx::Result<()> {
    sqlx::query!("INSERT INTO chat_rooms (name) VALUES ($1)", name)
        .execute(pool)
        .await?;
    sqlx::query!("INSERT INTO private_message (creator_id, content) VALUES ($1, $2)", 1, body)
        .execute(pool)
        .await?;
    sqlx::query!("INSERT INTO user_roles (user_id, role) VALUES ($1, $2)", 1, "admin")
        .execute(pool)
        .await?;
    Ok(())
}

pub fn diesel_rows(conn: &mut PgConnection, row: &NewTicket) {
    insert_into(tickets::table).values(row).execute(conn).unwrap();
}

// Turns kept in memory for the session are not a transcript.
pub fn in_memory(history: &mut Vec<ChatMessage>, set: &mut std::collections::HashSet<String>, text: String) {
    history.push(ChatMessage::user(text.clone()));
    set.insert(text);
}
