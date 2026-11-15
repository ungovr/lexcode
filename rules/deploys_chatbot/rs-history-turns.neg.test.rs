// lexcode-expect: 0
// An app's own ChatMessage and assistant builder, in a file that names no model crate.
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
