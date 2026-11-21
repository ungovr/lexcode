// lexcode-expect: 3
use futures::StreamExt;
use ollama_rs::generation::chat::{request::ChatMessageRequest, ChatMessage};
use ollama_rs::Ollama;
use teloxide::prelude::*;

#[tokio::main]
async fn main() {
    let bot = Bot::from_env();
    let handler = Update::filter_message().endpoint(answer);
    Dispatcher::builder(bot, handler)
        .dependencies(dptree::deps![Ollama::default()])
        .build()
        .dispatch()
        .await;
}

// A Telegram bot that answers every message with a local model's reply.
async fn answer(bot: Bot, msg: Message, ollama: Ollama) -> ResponseResult<()> {
    let text = msg.text().unwrap_or_default().to_string();
    let request = ChatMessageRequest::new("llama3.2".to_string(), vec![ChatMessage::user(text)]);
    let res = ollama.send_chat_messages(request).await.unwrap();
    bot.send_message(msg.chat.id, res.message.content).await?;
    Ok(())
}

// The same answer streamed: the bot posts a placeholder and edits it as the reply grows.
async fn streamed(bot: Bot, msg: Message, ollama: Ollama) -> ResponseResult<()> {
    let sent = bot.send_message(msg.chat.id, "...").await?;
    let request = ChatMessageRequest::new("llama3.2".to_string(), vec![ChatMessage::user("hi".into())]);
    let mut stream = ollama.send_chat_messages_stream(request).await.unwrap();
    let mut reply = String::new();
    while let Some(Ok(chunk)) = stream.next().await {
        reply.push_str(&chunk.message.content);
        bot.edit_message_text(msg.chat.id, sent.id, reply.clone()).await?;
    }
    bot.send_message(msg.chat.id, reply).reply_to_message_id(msg.id).await?;
    Ok(())
}
