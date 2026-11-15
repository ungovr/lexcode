// lexcode-expect: 0
// An app's own `Ollama` type (a client for its in-house text service) beside a commented-out use of the
// ollama-rs crate. A whole-file use guard reads use lines, never a comment, so neither the use lines in the
// comments below nor the `use ollama_rs::Ollama;` in this header admit the app's own send_chat_messages.
use axum::{extract::State, Json};
// use ollama_rs::Ollama;
// use ollama_rs::generation::chat::{request::ChatMessageRequest, ChatMessage};
/* use ollama_rs::Ollama; */

pub struct ChatMessageRequest {
    pub text: String,
}

pub struct ChatMessageResponse {
    pub message: String,
}

#[derive(Clone)]
pub struct Ollama;

impl Ollama {
    pub async fn send_chat_messages(&self, request: ChatMessageRequest) -> Result<ChatMessageResponse, String> {
        Ok(ChatMessageResponse { message: request.text.to_uppercase() })
    }
}

pub async fn chat(State(ollama): State<Ollama>, Json(text): Json<String>) -> Json<String> {
    let response = ollama.send_chat_messages(ChatMessageRequest { text }).await.unwrap();
    Json(response.message)
}
