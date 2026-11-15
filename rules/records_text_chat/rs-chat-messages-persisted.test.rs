// lexcode-expect: 11
use diesel::{insert_into, prelude::*};
use diesel as d;
use sea_orm::{ActiveModelTrait, EntityTrait, Set};
use sqlx::{query, PgPool};
use sqlx as sq;

pub async fn save_turn(pool: &PgPool, conversation_id: i64, text: &str) -> sqlx::Result<()> {
    sqlx::query!(
        "INSERT INTO chat_messages (conversation_id, body) VALUES ($1, $2)",
        conversation_id,
        text
    )
    .execute(pool)
    .await?;
    query(r#"insert into conversation_turns (conversation_id, content) values ($1, $2)"#)
        .bind(conversation_id)
        .bind(text)
        .execute(pool)
        .await?;
    sq::query("INSERT INTO support_chat_transcripts (body) VALUES ($1)")
        .bind(text)
        .execute(pool)
        .await?;
    sqlx::query(
        r#"
        INSERT INTO messages (thread_id, role, content)
        VALUES ($1, 'assistant', $2)
        "#,
    )
    .bind(conversation_id)
    .bind(text)
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn pg_client(client: &tokio_postgres::Client, text: &str) {
    client
        .execute("INSERT INTO chat_messages (body) VALUES ($1)", &[&text])
        .await
        .unwrap();
}

pub fn with_diesel(conn: &mut PgConnection, row: &NewChatMessage) {
    insert_into(chat_messages::table).values(row).execute(conn).unwrap();
    d::insert_into(schema::conversation_turns::table).values(row).execute(conn).unwrap();
}

pub async fn with_sea_orm(db: &DatabaseConnection, text: String) {
    let turn = chat_message::ActiveModel {
        body: Set(text.clone()),
        ..Default::default()
    };
    turn.insert(db).await.unwrap();
    chat_message::Entity::insert(chat_message::ActiveModel {
        body: Set(text),
        ..Default::default()
    })
    .exec(db)
    .await
    .unwrap();
}

pub async fn handler(state: AppState, text: String) {
    state.repo.save_chat_message(&text).await.unwrap();
    store_conversation(&state, &text).await;
}
