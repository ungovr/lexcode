// lexcode-expect: 8
use ollama_rs::{generation::chat::request::ChatMessageRequest, Ollama};
use rig::{
    cli_chatbot::{cli_chatbot, ChatBotBuilder},
    completion::Chat,
    providers::openai,
};
use rig as r;

pub async fn ollama_chat(ollama: Ollama, history: &mut Vec<ollama_rs::generation::chat::ChatMessage>, text: String) {
    let request = ChatMessageRequest::new("llama3.2".to_string(), vec![user(text)]);
    let reply = ollama
        .send_chat_messages_with_history(history, request)
        .await
        .unwrap();
    let stream = ollama
        .send_chat_messages_with_history_stream(std::sync::Arc::new(std::sync::Mutex::new(vec![])), next())
        .await
        .unwrap();
}

pub async fn rig_chat(client: openai::Client, prompt: String) -> anyhow::Result<()> {
    let agent = client.agent("gpt-4o").preamble("You answer questions about our store.").build();
    let mut history = Vec::new();
    let answer = agent.chat(prompt.as_str(), history.clone()).await?;
    history.push(r::completion::Message::user(prompt.clone()));
    let again = agent.prompt(prompt.as_str()).with_history(&mut history).await?;
    let mut stream = agent.stream_chat(prompt.as_str(), history.clone()).await?;
    Ok(())
}

// The chatbot items imported through the nested group above, and through the crate alias.
pub async fn terminal(client: openai::Client) -> anyhow::Result<()> {
    let agent = client.agent("gpt-4o").build();
    cli_chatbot(agent).await?;
    ChatBotBuilder::new().agent(client.agent("gpt-4o").build()).build().run().await?;
    r::cli_chatbot::ChatBotBuilder::new().agent(client.agent("gpt-4o").build()).build().run().await?;
    Ok(())
}
