// lexcode-expect: 0
package demo.ai;

import java.util.ArrayList;
import java.util.List;
import dev.langchain4j.data.message.ChatMessage;
import dev.langchain4j.model.chat.ChatLanguageModel;
import dev.langchain4j.service.AiServices;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.model.ChatModel;

public class Stateless {
    interface Summarizer {
        String summarize(String text);
    }

    // An AI service with no memory: every call stands alone.
    Summarizer summarizer(ChatLanguageModel model) {
        return AiServices.builder(Summarizer.class).chatLanguageModel(model).build();
    }

    // A Spring AI client with a system line and nothing that keeps earlier turns.
    ChatClient client(ChatModel model) {
        return ChatClient.builder(model).defaultSystem("Answer in one sentence.").build();
    }

    // Messages collected in a list for a single request.
    List<ChatMessage> oneRequest(ChatMessage question) {
        List<ChatMessage> messages = new ArrayList<>();
        messages.add(question);
        return messages;
    }

    // Memory that is not a chat's: a JVM heap reading and a cache sized in megabytes.
    long headroom(Runtime runtime, MemoryCache memoryCache) {
        memoryCache.resize(64);
        return runtime.freeMemory();
    }
}
