// lexcode-expect: 0
use ollama_rs::generation::chat::{request::ChatMessageRequest, ChatMessage};
use ollama_rs::Ollama;
use teloxide::prelude::*;

// teloxide's repl as a trigger-word bot: a fixed reply, and a canned answer looked up by keyword.
#[tokio::main]
async fn main() {
    let bot = Bot::from_env();
    teloxide::repl(bot, |bot: Bot, msg: Message| async move {
        let text = msg.text().unwrap_or_default().to_string();
        if text == "/start" {
            bot.send_message(msg.chat.id, "Welcome!").await?;
        }
        let canned = FAQ.get(text.as_str()).copied().unwrap_or("Sorry, I do not know that one.");
        bot.send_message(msg.chat.id, canned).await?;
        Ok(())
    })
    .await;
}

// The model labels the message for the moderators; the sender gets a fixed reply.
async fn triage(bot: Bot, msg: Message, ollama: Ollama) {
    tokio::spawn(async move {
        let request = ChatMessageRequest::new("llama3.2".to_string(), vec![ChatMessage::user("x".into())]);
        let res = ollama.send_chat_messages(request).await.unwrap();
        save_label(msg.id, &res.message.content).await;
        bot.send_message(msg.chat.id, "Thanks, a moderator will look at it.").await.unwrap();
    });
}
