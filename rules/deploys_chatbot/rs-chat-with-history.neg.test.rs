// lexcode-expect: 0
use std::collections::HashMap;

// An app's own chat service and history types, in a file that names no model library.
pub struct ChatBotBuilder;

impl ChatBotBuilder {
    pub fn new() -> Self {
        Self
    }
}

// rig is named only as a field type, with no use line for it: a mention is not an import.
// Nor is a comment line that begins with the word:
//   use rig::cli_chatbot later, once the store's agent exists.
pub struct Rooms {
    log: HashMap<u64, Vec<String>>,
    assistant: Option<rig::agent::Agent<rig::providers::openai::CompletionModel>>,
}

impl Rooms {
    pub async fn chat(&self, room: u64, history: Vec<String>) {
        let _ = (room, history);
    }

    pub fn with_history(&self, history: &mut Vec<String>) -> &Self {
        let _ = history;
        self
    }
}

pub async fn use_rooms(rooms: Rooms, mut history: Vec<String>) {
    rooms.chat(7, history.clone()).await;
    rooms.with_history(&mut history);
    let _b = ChatBotBuilder::new();
}
