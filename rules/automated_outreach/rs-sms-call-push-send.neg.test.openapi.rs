// lexcode-expect: 0
// An app's own create_message and create_call, and a chat client's create_message method, in a file
// that names no Twilio module.
use crate::db::{create_call, create_message, Db};

pub async fn save(db: &Db, thread: i64, text: String) {
    create_message(db, (thread, text)).await.unwrap();
    create_call(db, thread).await.unwrap();
    crate::db::create_message(db, (thread, String::new())).await.unwrap();
}

pub async fn ask(client: &anthropic::Client, params: anthropic::CreateMessageParams) {
    client.create_message(params).await.unwrap();
}
