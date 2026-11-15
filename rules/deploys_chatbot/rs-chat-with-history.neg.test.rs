// lexcode-expect: 0
use std::collections::HashMap;

// An app's own chat service and history types, in a file that names no model library.
pub struct ChatBotBuilder;

impl ChatBotBuilder {
    pub fn new() -> Self {
        Self
    }
}

pub struct Rooms {
    log: HashMap<u64, Vec<String>>,
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
