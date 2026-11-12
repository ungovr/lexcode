// lexcode-expect: 6
package demo.chat;

import java.util.List;
import dev.langchain4j.data.message.ChatMessage;
import dev.langchain4j.store.memory.chat.ChatMemoryStore;
import org.springframework.ai.chat.memory.ChatMemoryRepository;
import org.springframework.ai.chat.memory.repository.jdbc.JdbcChatMemoryRepository;
import org.springframework.ai.chat.memory.repository.cassandra.CassandraChatMemoryRepository;

// A chat memory whose turns are written to a database: the conversation outlives the process.
class DatabaseChatMemoryStore implements ChatMemoryStore {
    @Override
    public List<ChatMessage> getMessages(Object memoryId) {
        return List.of();
    }

    @Override
    public void updateMessages(Object memoryId, List<ChatMessage> messages) {
        // INSERT the turns
    }

    @Override
    public void deleteMessages(Object memoryId) {
        // DELETE the turns
    }
}

class RedisBackedRepository implements ChatMemoryRepository {
    @Override
    public List<String> findConversationIds() {
        return List.of();
    }

    @Override
    public List<org.springframework.ai.chat.messages.Message> findByConversationId(String conversationId) {
        return List.of();
    }

    @Override
    public void saveAll(String conversationId, List<org.springframework.ai.chat.messages.Message> messages) {
        // write the turns
    }

    @Override
    public void deleteByConversationId(String conversationId) {
        // delete the turns
    }
}

class Wiring {
    Object jdbc(org.springframework.jdbc.core.JdbcTemplate template) {
        return JdbcChatMemoryRepository.builder().jdbcTemplate(template).build();
    }

    Object cassandra(com.datastax.oss.driver.api.core.CqlSession session) {
        return CassandraChatMemoryRepository.create(session);
    }

    ChatMemoryStore anonymous() {
        return new ChatMemoryStore() {
            @Override
            public List<ChatMessage> getMessages(Object memoryId) {
                return List.of();
            }

            @Override
            public void updateMessages(Object memoryId, List<ChatMessage> messages) {
            }

            @Override
            public void deleteMessages(Object memoryId) {
            }
        };
    }

    Object mongo(org.springframework.data.mongodb.core.MongoTemplate template) {
        return new MongoChatMemoryRepository(template);
    }
}
