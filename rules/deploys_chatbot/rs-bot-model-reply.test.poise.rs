// lexcode-expect: 3
use poise::serenity_prelude as serenity;
use rig::completion::Prompt;
use rig::providers::openai;

struct Data {
    client: openai::Client,
}
type Error = Box<dyn std::error::Error + Send + Sync>;
type Ctx<'a> = poise::Context<'a, Data, Error>;

/// Ask the assistant a question.
#[poise::command(slash_command)]
async fn ask(ctx: Ctx<'_>, question: String) -> Result<(), Error> {
    let agent = ctx.data().client.agent("gpt-4o").preamble("You are a helpful assistant.").build();
    let answer = agent.prompt(question.as_str()).await?;
    ctx.say(&answer).await?;
    ctx.reply(answer.clone()).await?;
    ctx.send(poise::CreateReply::default().content(answer).ephemeral(true)).await?;
    Ok(())
}
