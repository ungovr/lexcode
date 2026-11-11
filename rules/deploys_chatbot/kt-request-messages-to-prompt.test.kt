// lexcode-expect: 5
package demo.ai

import dev.langchain4j.data.message.ChatMessage
import dev.langchain4j.model.chat.ChatLanguageModel
import io.ktor.server.application.call
import io.ktor.server.request.receive
import io.ktor.server.routing.Route
import io.ktor.server.routing.post
import org.springframework.ai.chat.model.ChatModel
import org.springframework.ai.chat.prompt.Prompt
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.reactive.function.server.ServerRequest
import org.springframework.web.reactive.function.server.awaitBody

// The conversation a client sends in a request goes straight to a language model, through a Spring AI
// Prompt or a LangChain4j chat call.
@RestController
class PromptController(
    private val chatModel: ChatModel,
    private val langchain: ChatLanguageModel,
) {
    @PostMapping("/chat/model")
    fun springAiModel(@RequestBody request: ChatRequest) = chatModel.call(Prompt(request.messages))

    @PostMapping("/chat/langchain")
    fun langchain4j(@RequestBody req: ChatRequest) = langchain.generate(req.messages)

    @PostMapping("/chat/langchain2")
    suspend fun langchain4jDirect(@RequestBody history: List<ChatMessage>): Any {
        return langchain.chat(history)
    }
}

fun Route.promptRoutes(chatModel: ChatModel) {
    post("/chat/prompt") {
        val request = call.receive<ChatRequest>()
        chatModel.call(Prompt(request.messages))
    }
}

class ReactivePromptHandler(private val chatModel: ChatModel) {
    suspend fun chat(request: ServerRequest): Any {
        val body = request.awaitBody<ChatRequest>()
        return chatModel.call(Prompt(body.messages))
    }
}
