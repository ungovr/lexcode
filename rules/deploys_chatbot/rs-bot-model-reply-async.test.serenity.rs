// lexcode-expect: 3
use async_openai::config::OpenAIConfig;
use async_openai::Client;
use serenity::all::{Context, CreateMessage, EventHandler, Message};
use serenity::async_trait;

struct Handler {
    openai: Client<OpenAIConfig>,
}

// The handler hands the model call to a task so the gateway is not held up.
#[async_trait]
impl EventHandler for Handler {
    async fn message(&self, ctx: Context, msg: Message) {
        let openai = self.openai.clone();
        let request = build_request(&msg.content);
        tokio::spawn(async move {
            let response = openai.chat().create(request).await.unwrap();
            let answer = response.choices[0].message.content.clone().unwrap_or_default();
            msg.reply(&ctx.http, &answer).await.unwrap();
            msg.channel_id.say(&ctx.http, answer.clone()).await.unwrap();
            msg.channel_id
                .send_message(&ctx.http, CreateMessage::new().content(answer))
                .await
                .unwrap();
        });
    }
}
