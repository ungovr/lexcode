// lexcode-expect: 0
package demo.ai

import io.ktor.server.application.call
import io.ktor.server.request.receive
import io.ktor.server.request.receiveText
import io.ktor.server.routing.Route
import io.ktor.server.routing.post
import com.aallam.openai.api.chat.ChatCompletionRequest
import com.aallam.openai.api.model.ModelId
import com.aallam.openai.client.OpenAI
import org.springframework.ai.chat.client.ChatClient
import org.springframework.ai.chat.messages.UserMessage
import org.springframework.ai.chat.model.ChatModel
import org.springframework.ai.chat.prompt.Prompt
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
class ToolController(
    private val chatClient: ChatClient,
    private val chatModel: ChatModel,
    private val notes: NoteRepository,
    private val templates: MailTemplates,
    private val archive: ArchiveService,
    private val aallam: OpenAI,
) {
    // One typed question inside a fixed prompt is a one-shot tool, not a chatbot.
    @PostMapping("/summarize")
    fun summarize(@RequestBody text: String): String =
        chatClient.prompt().user("Summarize in one line: $text").call().content()

    // A list of messages from the client that goes to a database and not to a model.
    @PostMapping("/notes")
    fun importNotes(@RequestBody messages: List<NoteDto>) {
        notes.saveAll(messages)
    }

    // Messages that come from the app's own store, not from the request: the handler reads a body
    // but the list sent to the model is the archive's.
    @PostMapping("/replay")
    fun replay(@RequestBody request: ReplayRequest): String =
        chatClient.prompt().messages(archive.messages).call().content()

    // The request's own value goes to the model, but it is not a conversation: its property is named
    // for something else, or the whole body is one string.
    @PostMapping("/options")
    fun options(@RequestBody request: OptionsRequest, @RequestBody note: String): String {
        chatClient.prompt().messages(request.options).call().content()
        chatClient.prompt().messages(note).call().content()
        return aallam.chatCompletion(ChatCompletionRequest(model = ModelId("m"), messages = request.options)) +
            aallam.chatCompletion(ChatCompletionRequest(model = ModelId("m"), messages = note))
    }

    // A parameter that is not the request body (a path variable or a query parameter) is not the client's conversation.
    @PostMapping("/lookup/{id}")
    fun lookup(@PathVariable messages: List<String>, @RequestParam(required = false) history: List<String>): String {
        chatClient.prompt().messages(messages).call().content()
        return chatClient.prompt().messages(history).call().content()
    }

    // Builders of requests that are not model requests, fed the request's own list.
    @PostMapping("/notify")
    fun notify(@RequestBody request: ChatRequest, @RequestBody messages: List<String>): Any {
        NotificationRequest.builder().messages(request.messages)
        return MailRequest.builder().messages(messages).build()
    }

    // A "messages" builder that is not a model request, and a generate() on a renderer.
    @PostMapping("/mail-preview")
    fun preview(@RequestBody messages: List<String>): String {
        templates.generate(messages)
        return templates.builder().messages(messages).render()
    }
}

// Ktor routes: one received string in a fixed prompt, and a received list that goes to storage.
fun Route.tools(chatClient: ChatClient, notes: NoteRepository, templates: MailTemplates) {
    post("/summarize") {
        val text = call.receiveText()
        chatClient.prompt().user("Summarize in one line: $text").call().content()
    }

    post("/notes") {
        val request = call.receive<NoteImport>()
        notes.saveAll(request.messages)
    }

    post("/mail-preview") {
        val request = call.receive<PreviewRequest>()
        templates.builder().messages(request.messages).render()
    }
}

// A job that builds its own messages from a file and calls the model: no client conversation.
class NightlyClassifier(private val chatClient: ChatClient) {
    fun classify(history: List<org.springframework.ai.chat.messages.Message>): String =
        chatClient.prompt().messages(history).call().content()

    suspend fun classifyFromQueue(queue: Queue) {
        val request = queue.receive<ClassifyRequest>()
        chatClient.prompt().messages(request.messages).call().content()
    }
}
