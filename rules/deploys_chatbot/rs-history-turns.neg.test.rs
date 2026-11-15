// lexcode-expect: 0
// An app's own ChatMessage and assistant builder, in a file that has no use line for a model crate.
// The crates are named only as field types (M6): a mention is not an import.
// Nor is a comment: use ollama_rs for the real thing, and
//     use async_openai once the account is set up.
pub struct Clients {
    pub ollama: ollama_rs::Ollama,
    pub openai: async_openai::Client<async_openai::config::OpenAIConfig>,
}

pub struct ChatMessage {
    pub role: String,
    pub content: String,
}

impl ChatMessage {
    pub fn assistant(content: String) -> Self {
        Self { role: "assistant".into(), content }
    }
}

pub struct ChatCompletionRequestAssistantMessageArgs {
    content: String,
}

impl ChatCompletionRequestAssistantMessageArgs {
    pub fn default() -> Self {
        Self { content: String::new() }
    }

    pub fn content(mut self, c: String) -> Self {
        self.content = c;
        self
    }
}

pub fn render(reply: String) -> (ChatMessage, ChatCompletionRequestAssistantMessageArgs) {
    (
        ChatMessage::assistant(reply.clone()),
        ChatCompletionRequestAssistantMessageArgs::default().content(reply),
    )
}
