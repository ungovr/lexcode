// lexcode-expect: 6
package demo.chat

import dev.langchain4j.data.message.ChatMessage
import dev.langchain4j.store.memory.chat.ChatMemoryStore
import org.springframework.ai.chat.memory.ChatMemoryRepository
import org.springframework.ai.chat.memory.repository.cassandra.CassandraChatMemoryRepository
import org.springframework.ai.chat.memory.repository.jdbc.JdbcChatMemoryRepository
import org.springframework.ai.chat.memory.repository.mongo.MongoChatMemoryRepository

// A chat memory whose turns are written to a database: the conversation outlives the process.
class DatabaseChatMemoryStore : ChatMemoryStore {
    override fun getMessages(memoryId: Any): List<ChatMessage> = emptyList()

    override fun updateMessages(memoryId: Any, messages: List<ChatMessage>) {
        // INSERT the turns
    }

    override fun deleteMessages(memoryId: Any) {
        // DELETE the turns
    }
}

class RedisBackedRepository(private val redis: RedisClient) : ChatMemoryRepository {
    override fun findConversationIds(): List<String> = emptyList()

    override fun findByConversationId(conversationId: String): List<org.springframework.ai.chat.messages.Message> = emptyList()

    override fun saveAll(conversationId: String, messages: List<org.springframework.ai.chat.messages.Message>) {
        // write the turns
    }

    override fun deleteByConversationId(conversationId: String) {
        // delete the turns
    }
}

class Wiring {
    fun jdbc(template: org.springframework.jdbc.core.JdbcTemplate) =
        JdbcChatMemoryRepository.builder().jdbcTemplate(template).build()

    fun cassandra(session: com.datastax.oss.driver.api.core.CqlSession) = CassandraChatMemoryRepository.create(session)

    fun anonymous(): ChatMemoryStore = object : ChatMemoryStore {
        override fun getMessages(memoryId: Any): List<ChatMessage> = emptyList()

        override fun updateMessages(memoryId: Any, messages: List<ChatMessage>) {
        }

        override fun deleteMessages(memoryId: Any) {
        }
    }

    fun mongo(template: org.springframework.data.mongodb.core.MongoTemplate) = MongoChatMemoryRepository(template)
}
