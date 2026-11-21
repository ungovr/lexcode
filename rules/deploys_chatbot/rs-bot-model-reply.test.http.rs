// lexcode-expect: 2
use serde_json::Value;
use serenity::model::channel::Message;
use serenity::prelude::*;

const CHAT_URL: &str = "https://api.openai.com/v1/chat/completions";

struct Handler {
    http: reqwest::Client,
}

// serenity 0.11's closure builders, with the model called over HTTP.
#[serenity::async_trait]
impl EventHandler for Handler {
    async fn message(&self, ctx: Context, msg: Message) {
        let body: Value = self
            .http
            .post("https://api.anthropic.com/v1/messages")
            .json(&build_body(&msg.content))
            .send()
            .await
            .unwrap()
            .json()
            .await
            .unwrap();
        let text = body["content"][0]["text"].as_str().unwrap_or_default().to_string();
        msg.channel_id.send_message(&ctx.http, |m| m.content(text)).await.unwrap();
        let other: Value = self.http.post(CHAT_URL).json(&build_body(&msg.content)).send().await.unwrap().json().await.unwrap();
        let reply = other["choices"][0]["message"]["content"].as_str().unwrap_or_default().to_string();
        msg.channel_id.send_message(&ctx.http, |m| m.embed(|e| e.description(reply))).await.unwrap();
    }
}
