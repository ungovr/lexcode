// lexcode-expect: 0
use std::collections::HashMap;

use async_openai::config::OpenAIConfig;
use async_openai::types::CreateChatCompletionRequest;
use async_openai::Client;
use serenity::all::{
    Context, CreateEmbed, CreateInteractionResponse, CreateInteractionResponseMessage, CreateMessage,
    EventHandler, Interaction, Message,
};
use serenity::async_trait;

struct Handler {
    faqs: HashMap<String, String>,
    openai: Client<OpenAIConfig>,
}

#[async_trait]
impl EventHandler for Handler {
    // A trigger-word bot: a fixed reply, and a canned answer looked up by the word that matched.
    async fn message(&self, ctx: Context, msg: Message) {
        if msg.content == "!ping" {
            msg.channel_id.say(&ctx.http, "Pong!").await.unwrap();
        }
        for (trigger, answer) in &self.faqs {
            if msg.content.contains(trigger.as_str()) {
                let embed = CreateEmbed::new().title("Automated Answer").description(answer);
                msg.channel_id.send_message(&ctx.http, CreateMessage::new().embed(embed)).await.unwrap();
                msg.reply(&ctx.http, answer).await.unwrap();
            }
        }
    }

    // A command bot: the reply is the user's own count, read from the app's store.
    async fn interaction_create(&self, ctx: Context, interaction: Interaction) {
        if let Interaction::Command(command) = interaction {
            let coins = self.faqs.get(&command.user.id.to_string()).cloned().unwrap_or_default();
            let data = CreateInteractionResponseMessage::new().content(format!("You have {coins} coins"));
            command
                .create_response(&ctx.http, CreateInteractionResponse::Message(data))
                .await
                .unwrap();
        }
    }
}

impl Handler {
    // The model is called, but its output goes to the app's own log, and the member gets a fixed
    // acknowledgement: no reply comes from the model.
    async fn summarize(&self, ctx: &Context, msg: &Message, request: CreateChatCompletionRequest) {
        let response = self.openai.chat().create(request).await.unwrap();
        let summary = response.choices[0].message.content.clone().unwrap_or_default();
        tracing::info!(summary = %summary, "thread summary");
        store_summary(&summary).await;
        msg.reply(&ctx.http, "Thanks, noted.").await.unwrap();
    }
}
