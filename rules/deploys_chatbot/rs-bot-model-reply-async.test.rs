// lexcode-expect: 4
use async_openai::config::OpenAIConfig;
use async_openai::Client;
use ollama_rs::generation::chat::{request::ChatMessageRequest, ChatMessage};
use ollama_rs::Ollama;
use teloxide::prelude::*;

// teloxide's repl: every message is answered with a local model's reply.
#[tokio::main]
async fn main() {
    let bot = Bot::from_env();
    let ollama = Ollama::default();
    teloxide::repl(bot, move |bot: Bot, msg: Message| {
        let ollama = ollama.clone();
        async move {
            let text = msg.text().unwrap_or_default().to_string();
            let request = ChatMessageRequest::new("llama3.2".to_string(), vec![ChatMessage::user(text)]);
            let res = ollama.send_chat_messages(request).await.unwrap();
            bot.send_message(msg.chat.id, res.message.content).await?;
            Ok(())
        }
    })
    .await;
}

// The answer taken out of the response in a second `let`, and sent from a spawned task.
async fn spawned(bot: Bot, msg: Message, openai: Client<OpenAIConfig>, request: Request) {
    tokio::spawn(async move {
        let response = openai.chat().create(request).await.unwrap();
        let answer = response.choices[0].message.content.clone().unwrap_or_default();
        bot.send_message(msg.chat.id, answer.clone()).await.unwrap();
        bot.edit_message_text(msg.chat.id, msg.id, format!("{}\n\n(edited)", answer)).await.unwrap();
    });
}

// A model reached over HTTP, in an async block of its own.
async fn over_http(bot: Bot, msg: Message, http: reqwest::Client) {
    let fut = async {
        let body: serde_json::Value = http
            .post("https://api.openai.com/v1/chat/completions")
            .json(&serde_json::json!({}))
            .send()
            .await?
            .json()
            .await?;
        bot.send_message(msg.chat.id, body["choices"][0]["message"]["content"].to_string()).await?;
        Ok::<(), anyhow::Error>(())
    };
    fut.await.unwrap();
}
