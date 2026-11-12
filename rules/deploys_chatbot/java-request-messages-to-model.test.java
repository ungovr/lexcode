// lexcode-expect: 11
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
    private final ChatLanguageModel languageModel;

    public ChatController(ChatClient chatClient, ChatModel chatModel, OpenAIClient openai, AnthropicClient anthropic,
                          ChatLanguageModel languageModel) {
        this.chatClient = chatClient;
        this.chatModel = chatModel;
        this.openai = openai;
        this.anthropic = anthropic;
        this.languageModel = languageModel;
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

    @PostMapping("/chat/languageModel")
    public Object langchain4j(@RequestBody ChatRequest req) {
        return languageModel.generate(req.getMessages());
    }

    @PostMapping("/chat/langchain2")
    public Object langchain4jDirect(@RequestBody List<ChatMessage> history) {
        return languageModel.chat(history);
    }

    // The request's list reaches the call through a conversion, from an annotation with arguments, or
    // into a builder of a named model request type or a model named with a camel-case AI part.
    @PostMapping("/chat/mapped")
    public String mapped(@RequestBody ChatRequest request) {
        return chatClient.prompt().messages(request.getMessages().stream().toList()).call().content();
    }

    @PostMapping("/chat/required")
    public String required(@RequestBody(required = true) ChatRequest request) {
        return chatClient.prompt().messages(request.getMessages()).call().content();
    }

    @PostMapping("/chat/bedrock")
    public Object bedrock(@RequestBody ChatRequest request) {
        return ConverseRequest.builder().modelId("m").messages(request.getMessages()).build();
    }

    @PostMapping("/chat/langchain-request")
    public Object langchainRequest(@RequestBody ChatRequest request) {
        return dev.langchain4j.model.chat.request.ChatRequest.builder().messages(request.getMessages()).build();
    }

    @PostMapping("/chat/openai-named")
    public Object named(@RequestBody ChatRequest request, ChatLanguageModel openAI) {
        return openAI.chat(request.getMessages());
    }
}

