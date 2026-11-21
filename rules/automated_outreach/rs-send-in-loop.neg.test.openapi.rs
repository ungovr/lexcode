// lexcode-expect: 0
// An app's own create_message, saving each row of a thread, in a file that names no Twilio module.
use crate::db::{create_message, Db};

pub async fn import(db: &Db, rows: Vec<Row>) {
    for row in rows {
        create_message(db, row).await.unwrap();
    }
}
