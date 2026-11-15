// lexcode-expect: 4
use diesel::prelude::*;
use sea_orm::entity::prelude::*;

#[derive(Queryable, Selectable)]
#[diesel(table_name = crate::schema::chat_messages)]
#[diesel(check_for_backend(diesel::pg::Pg))]
pub struct ChatMessage {
    pub id: i64,
    pub body: String,
}

#[derive(Insertable)]
#[diesel(table_name = conversation_turns)]
pub struct NewTurn<'a> {
    pub role: &'a str,
    pub content: &'a str,
}

#[derive(Clone, Debug, PartialEq, DeriveEntityModel)]
#[sea_orm(table_name = "chat_messages")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: i64,
    pub body: String,
}

#[derive(Clone, Debug, PartialEq, DeriveEntityModel)]
#[sea_orm(schema_name = "support", table_name = "chat_transcripts")]
pub struct Transcript {
    #[sea_orm(primary_key)]
    pub id: i64,
    pub text: String,
}
