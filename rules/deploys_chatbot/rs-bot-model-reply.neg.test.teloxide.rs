// lexcode-expect: 0
use ollama_rs::generation::chat::{request::ChatMessageRequest, ChatMessage};
use ollama_rs::Ollama;
use teloxide::prelude::*;
use teloxide::utils::command::BotCommands;

#[derive(BotCommands, Clone)]
#[command(rename_rule = "lowercase")]
enum Command {
    Help,
    Price(String),
}

// A command bot: a fixed help text and a price looked up from the app's own table.
async fn answer(bot: Bot, msg: Message, cmd: Command, prices: Prices) -> ResponseResult<()> {
    match cmd {
        Command::Help => bot.send_message(msg.chat.id, Command::descriptions().to_string()).await?,
        Command::Price(item) => {
            let price = prices.lookup(&item).unwrap_or_default();
            bot.send_message(msg.chat.id, format!("{item}: {price}")).await?
        }
    };
    Ok(())
}

// The model labels the message for the moderators' queue; the sender gets a fixed reply.
async fn triage(bot: Bot, msg: Message, ollama: Ollama) -> ResponseResult<()> {
    let text = msg.text().unwrap_or_default().to_string();
    let request = ChatMessageRequest::new("llama3.2".to_string(), vec![ChatMessage::user(text)]);
    let res = ollama.send_chat_messages(request).await.unwrap();
    save_label(msg.id, &res.message.content).await;
    bot.send_message(msg.chat.id, "Thanks, a moderator will look at it.").await?;
    Ok(())
}
