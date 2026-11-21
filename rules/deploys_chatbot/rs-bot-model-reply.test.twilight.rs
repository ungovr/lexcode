// lexcode-expect: 1
use std::sync::Arc;

use genai::chat::{ChatMessage, ChatRequest};
use twilight_gateway::Event;
use twilight_http::Client as HttpClient;

// A twilight bot answering each message with a model's reply through genai.
async fn handle_event(event: Event, http: Arc<HttpClient>, ai: genai::Client) -> anyhow::Result<()> {
    if let Event::MessageCreate(msg) = event {
        if msg.author.bot {
            return Ok(());
        }
        let request = ChatRequest::new(vec![ChatMessage::user(msg.content.clone())]);
        let response = ai.exec_chat("gpt-4o-mini", request, None).await?;
        let answer = response.first_text().unwrap_or_default().to_string();
        http.create_message(msg.channel_id).content(&answer).await?;
    }
    Ok(())
}
