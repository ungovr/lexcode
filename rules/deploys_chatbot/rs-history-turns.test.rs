// lexcode-expect: 5
use async_openai::{
    config::OpenAIConfig,
    types::{
        ChatCompletionRequestAssistantMessageArgs, ChatCompletionRequestMessage,
        ChatCompletionRequestUserMessageArgs, CreateChatCompletionRequestArgs,
    },
    Client,
};
use async_openai as oai;
use ollama_rs::{generation::chat::ChatMessage, Ollama};

pub async fn repl(client: Client<OpenAIConfig>) -> anyhow::Result<()> {
    let mut messages: Vec<ChatCompletionRequestMessage> = vec![];
    loop {
        let line = read_line()?;
        messages.push(ChatCompletionRequestUserMessageArgs::default().content(line).build()?.into());
        let request = CreateChatCompletionRequestArgs::default()
            .model("gpt-4o-mini")
            .messages(messages.clone())
            .build()?;
        let response = client.chat().create(request).await?;
        let reply = response.choices[0].message.content.clone().unwrap_or_default();
        println!("{reply}");
        messages.push(
            ChatCompletionRequestAssistantMessageArgs::default()
                .content(reply)
                .build()?
                .into(),
        );
        messages.push(
            oai::types::ChatCompletionRequestAssistantMessageArgs::default()
                .content(response.choices[0].message.content.clone().unwrap_or_default())
                .build()?
                .into(),
        );
    }
}

pub fn from_store(rows: Vec<StoredTurn>) -> Vec<ChatMessage> {
    rows.into_iter()
        .map(|row| match row.role.as_str() {
            "assistant" => ChatMessage::assistant(row.content),
            _ => ChatMessage::user(row.content),
        })
        .collect()
}

pub async fn ollama_turns(ollama: Ollama, history: &mut Vec<ChatMessage>, reply: String) {
    history.push(ChatMessage::assistant(reply.clone()));
    history.push(ollama_rs::generation::chat::ChatMessage::assistant(reply));
}
