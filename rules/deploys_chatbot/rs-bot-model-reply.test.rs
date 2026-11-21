// lexcode-expect: 6
use async_openai::config::OpenAIConfig;
use async_openai::types::{ChatCompletionRequestUserMessageArgs, CreateChatCompletionRequestArgs};
use async_openai::Client;
use serenity::all::{
    Context, CreateEmbed, CreateInteractionResponse, CreateInteractionResponseMessage, CreateMessage,
    EditInteractionResponse, EventHandler, Interaction, Message,
};
use serenity::async_trait;

struct Handler {
    openai: Client<OpenAIConfig>,
}

impl Handler {
    fn request(&self, text: &str) -> async_openai::types::CreateChatCompletionRequest {
        CreateChatCompletionRequestArgs::default()
            .model("gpt-4o-mini")
            .messages([ChatCompletionRequestUserMessageArgs::default()
                .content(text)
                .build()
                .unwrap()
                .into()])
            .build()
            .unwrap()
    }
}

#[async_trait]
impl EventHandler for Handler {
    // A member writes in the channel and the bot answers with what the model wrote.
    async fn message(&self, ctx: Context, msg: Message) {
        if msg.author.bot {
            return;
        }
        let response = self.openai.chat().create(self.request(&msg.content)).await.unwrap();
        let answer = response.choices[0].message.content.clone().unwrap_or_default();
        msg.reply(&ctx.http, &answer).await.unwrap();
        msg.channel_id.say(&ctx.http, format!("> {}", answer)).await.unwrap();
        msg.channel_id
            .send_message(&ctx.http, CreateMessage::new().content(answer.clone()))
            .await
            .unwrap();
        let embed = CreateEmbed::new().title("Answer").description(answer);
        msg.channel_id.send_message(&ctx.http, CreateMessage::new().embed(embed)).await.unwrap();
    }

    // A slash command whose answer is the model's.
    async fn interaction_create(&self, ctx: Context, interaction: Interaction) {
        if let Interaction::Command(command) = interaction {
            let question = command.data.options[0].value.as_str().unwrap_or_default().to_string();
            let response = self.openai.chat().create(self.request(&question)).await.unwrap();
            let answer = response.choices[0].message.content.clone().unwrap_or_default();
            let data = CreateInteractionResponseMessage::new().content(answer.clone());
            command
                .create_response(&ctx.http, CreateInteractionResponse::Message(data))
                .await
                .unwrap();
            command
                .edit_response(&ctx.http, EditInteractionResponse::new().content(answer))
                .await
                .unwrap();
        }
    }
}
