// lexcode-expect: 13
package demo.ai

import com.aallam.openai.api.chat.ChatCompletionRequest
import com.aallam.openai.api.model.ModelId
import com.aallam.openai.client.OpenAI
import com.anthropic.client.AnthropicClient
import com.anthropic.models.messages.MessageCreateParams
import com.openai.client.OpenAIClient
import com.openai.models.chat.completions.ChatCompletionCreateParams
import dev.langchain4j.data.message.ChatMessage
import dev.langchain4j.model.chat.ChatLanguageModel
import io.ktor.server.application.call
import io.ktor.server.request.receive
import io.ktor.server.routing.Route
import io.ktor.server.routing.post
import org.springframework.ai.chat.client.ChatClient
import org.springframework.ai.chat.model.ChatModel
import org.springframework.ai.chat.prompt.Prompt
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.reactive.function.server.ServerRequest
import org.springframework.web.reactive.function.server.awaitBody
import jakarta.ws.rs.POST

// The conversation a client sends in a request goes straight to a language model.
@RestController
class ChatController(
    private val chatClient: ChatClient,
    private val chatModel: ChatModel,
    private val openai: OpenAIClient,
    private val anthropic: AnthropicClient,
    private val langchain: ChatLanguageModel,
) {
    @PostMapping("/chat")
    fun springAiClient(@RequestBody request: ChatRequest): String =
        chatClient.prompt().messages(request.messages).call().content()

    @PostMapping("/chat/openai")
    fun openAi(@RequestBody messages: List<ChatMessage>): Any {
        val params = ChatCompletionCreateParams.builder().model("gpt-4o").messages(messages).build()
        return openai.chat().completions().create(params)
    }

    @PostMapping("/chat/anthropic")
    fun claude(@RequestBody body: ChatRequest): Any {
        val params = MessageCreateParams.builder().maxTokens(1024L).messages(body.history).build()
        return anthropic.messages().create(params)
    }

}

// Ktor routes read the request body with call.receive and pass its messages on.
fun Route.chatRoutes(chatClient: ChatClient, aallam: OpenAI) {
    post("/chat") {
        val request = call.receive<ChatRequest>()
        chatClient.prompt().messages(request.messages).call().content()
    }

    post("/chat/openai-kotlin") {
        val req: ChatRequest = call.receive()
        aallam.chatCompletion(ChatCompletionRequest(model = ModelId("gpt-4o"), messages = req.messages))
    }
}

// A functional WebFlux handler reads the body with awaitBody, and a JAX-RS resource takes it as a parameter.
class ReactiveChatHandler(private val chatClient: ChatClient) {
    suspend fun chat(request: ServerRequest): String {
        val body = request.awaitBody<ChatRequest>()
        return chatClient.prompt().messages(body.messages).call().content()
    }
}

class ChatResource(private val chatClient: ChatClient) {
    @POST
    fun chat(payload: ChatRequest): String = chatClient.prompt().messages(payload.messages).call().content()
}

// A Ktor handler written as a function over the call rather than a route lambda.
suspend fun handleChat(call: io.ktor.server.application.ApplicationCall, chatClient: ChatClient) {
    val chat = call.receive<ChatRequest>()
    chatClient.prompt().messages(chat.messages).call().content()
}

// The request's list reaches the call through a conversion, a not-null assertion, an annotation with
// arguments, or a builder of a named model request type.
class MappedChatController(
    private val chatClient: ChatClient,
    private val openai: OpenAIClient,
) {
    @PostMapping("/chat/mapped")
    fun mapped(@RequestBody request: ChatRequest): String =
        chatClient.prompt().messages(request.messages.map { toSpring(it) }).call().content()

    @PostMapping("/chat/asserted")
    fun asserted(@RequestBody request: ChatRequest): String =
        chatClient.prompt().messages(request.messages!!).call().content()

    @PostMapping("/chat/required")
    fun required(@RequestBody(required = true) request: ChatRequest): String =
        chatClient.prompt().messages(request.messages).call().content()

    @PostMapping("/chat/bedrock")
    fun bedrock(@RequestBody request: ChatRequest) =
        ConverseRequest.builder().modelId("m").messages(request.messages).build()

    @PostMapping("/chat/langchain-request")
    fun langchainRequest(@RequestBody request: ChatRequest) =
        dev.langchain4j.model.chat.request.ChatRequest.builder().messages(request.messages).build()
}
