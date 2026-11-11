// lexcode-expect: 0
package demo.chat;

import java.util.List;
import dev.langchain4j.data.message.ChatMessage;
import dev.langchain4j.memory.chat.InMemoryChatMemoryStore;
import dev.langchain4j.store.memory.chat.ChatMemoryStore;
import org.springframework.ai.chat.memory.InMemoryChatMemoryRepository;
import org.springframework.ai.chat.memory.MessageWindowChatMemory;

// A conversation held in process memory only, and stores that hold other things.
public class NothingKept {
    // In-memory stores keep the turns only until the process ends; nothing is written down.
    ChatMemoryStore memoryOnly() {
        return new InMemoryChatMemoryStore();
    }

    Object springInMemory() {
        return MessageWindowChatMemory.builder().chatMemoryRepository(new InMemoryChatMemoryRepository()).build();
    }
}

// A store with a similar name that holds sessions, not chat messages.
class SessionStore {
    private final java.util.Map<String, String> sessions = new java.util.HashMap<>();

    void put(String id, String user) {
        sessions.put(id, user);
    }
}

// A class that implements a different interface of the same libraries.
class TokenCounter implements dev.langchain4j.model.Tokenizer {
    @Override
    public int estimateTokenCountInText(String text) {
        return text.length() / 4;
    }

    @Override
    public int estimateTokenCountInMessage(ChatMessage message) {
        return 0;
    }

    @Override
    public int estimateTokenCountInMessages(Iterable<ChatMessage> messages) {
        return 0;
    }
}
