// lexcode-expect: 0
use diesel::prelude::*;
use sea_orm::entity::prelude::*;

// A contact form, a chat room with no text, and a user-to-user inbox.
#[derive(Insertable)]
#[diesel(table_name = contact_messages)]
pub struct NewContactMessage {
    pub body: String,
}

#[derive(Queryable)]
#[diesel(table_name = chat_rooms)]
pub struct ChatRoom {
    pub id: i64,
    pub name: String,
}

#[derive(Clone, Debug, PartialEq, DeriveEntityModel)]
#[sea_orm(table_name = "private_message")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: i64,
    pub content: String,
}

// A chat message type that is never mapped: a transfer object stores nothing.
#[derive(serde::Deserialize)]
pub struct ChatMessageDto {
    pub role: String,
    pub content: String,
}
