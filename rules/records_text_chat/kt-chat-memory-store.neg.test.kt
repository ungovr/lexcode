// lexcode-expect: 0
package demo.chat

// This file imports neither LangChain4j nor Spring AI (the library types are written in full where
// they appear), so a class or a call that only has the library's name is the app's own.

// A conversation held in process memory only, and stores that hold other things.
class NothingKept {
    // In-memory stores keep the turns only until the process ends; nothing is written down.
    fun memoryOnly(): dev.langchain4j.store.memory.chat.ChatMemoryStore =
        dev.langchain4j.memory.chat.InMemoryChatMemoryStore()

    fun springInMemory() =
        org.springframework.ai.chat.memory.MessageWindowChatMemory.builder()
            .chatMemoryRepository(org.springframework.ai.chat.memory.InMemoryChatMemoryRepository())
            .build()
}

// A store with a similar name that holds sessions, not chat messages.
class SessionStore {
    private val sessions = mutableMapOf<String, String>()

    fun put(id: String, user: String) {
        sessions[id] = user
    }
}

// A class that implements a different interface of the same libraries.
class TokenCounter : dev.langchain4j.model.Tokenizer {
    override fun estimateTokenCountInText(text: String): Int = text.length / 4

    override fun estimateTokenCountInMessage(message: dev.langchain4j.data.message.ChatMessage): Int = 0

    override fun estimateTokenCountInMessages(messages: Iterable<dev.langchain4j.data.message.ChatMessage>): Int = 0
}

// The app's own interfaces with the library names, and classes of its own implementing them.
interface ChatMemoryStore {
    fun load(id: String): List<String>
}

interface ChatMemoryRepository {
    fun load(id: String): List<String>
}

class FileChatMemoryStore : ChatMemoryStore {
    override fun load(id: String): List<String> = emptyList()
}

class DbChatMemoryStore(private val db: Db) : ChatMemoryStore {
    override fun load(id: String): List<String> = emptyList()
}

class SqlChatMemoryRepository(private val db: Db) : ChatMemoryRepository {
    override fun load(id: String): List<String> = emptyList()
}

val anonymousStore = object : ChatMemoryStore {
    override fun load(id: String): List<String> = emptyList()
}

// Calls with names near the repository names, and constructors of other stores.
class Wiring {
    fun others(db: Db, template: Any) {
        SessionStore()
        InMemoryChatMemoryRepository()
        OrderRepository(db)
        AcmeJdbcChatMemoryRepository(db)
        JdbcOrderRepository.builder().build()
        MongoTemplate.create(template)
    }
}
