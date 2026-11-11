// lexcode-expect: 6
package demo.ai;

import java.util.List;
import com.anthropic.client.AnthropicClient;
import com.anthropic.models.messages.MessageCreateParams;
import com.openai.client.OpenAIClient;
import com.openai.models.chat.completions.ChatCompletionCreateParams;
import dev.langchain4j.data.message.ChatMessage;
import dev.langchain4j.model.chat.ChatLanguageModel;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

// The conversation a client sends in a request goes straight to a language model.
@RestController
public class ChatController {
    private final ChatClient chatClient;
    private final ChatModel chatModel;
    private final OpenAIClient openai;
    private final AnthropicClient anthropic;
    private final ChatLanguageModel langchain;

    public ChatController(ChatClient chatClient, ChatModel chatModel, OpenAIClient openai, AnthropicClient anthropic,
                          ChatLanguageModel langchain) {
        this.chatClient = chatClient;
        this.chatModel = chatModel;
        this.openai = openai;
        this.anthropic = anthropic;
        this.langchain = langchain;
    }

    @PostMapping("/chat")
    public String springAiClient(@RequestBody ChatRequest request) {
        return chatClient.prompt().messages(request.getMessages()).call().content();
    }

    @PostMapping("/chat/model")
    public Object springAiModel(@RequestBody ChatRequest request) {
        return chatModel.call(new Prompt(request.messages()));
    }

    @PostMapping("/chat/openai")
    public Object openAi(@RequestBody List<ChatMessage> messages) {
        ChatCompletionCreateParams params = ChatCompletionCreateParams.builder().model("gpt-4o").messages(messages).build();
        return openai.chat().completions().create(params);
    }

    @PostMapping("/chat/anthropic")
    public Object claude(@RequestBody ChatRequest body) {
        MessageCreateParams params = MessageCreateParams.builder().maxTokens(1024L).messages(body.getHistory()).build();
        return anthropic.messages().create(params);
    }

    @PostMapping("/chat/langchain")
    public Object langchain4j(@RequestBody ChatRequest req) {
        return langchain.generate(req.getMessages());
    }

    @PostMapping("/chat/langchain2")
    public Object langchain4jDirect(@RequestBody List<ChatMessage> history) {
        return langchain.chat(history);
    }
}
