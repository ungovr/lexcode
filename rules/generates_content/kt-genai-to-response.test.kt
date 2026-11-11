// lexcode-expect: 13
package com.example.content

import org.springframework.scheduling.annotation.Scheduled
import android.widget.TextView
import com.google.ai.client.generativeai.GenerativeModel
import com.google.firebase.Firebase
import com.google.firebase.vertexai.vertexAI
import com.google.genai.Client
import io.ktor.server.application.call
import io.ktor.server.response.respond
import io.ktor.server.routing.Route
import io.ktor.server.routing.get
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter

@RestController
class GeminiController(
  private val client: Client,
  private val vertex: com.google.cloud.vertexai.generativeai.GenerativeModel,
) {
  // Whatever the model returns, text or an image, is the response body.
  @GetMapping("/caption")
  fun caption(@RequestParam text: String): String {
    val response = client.models.generateContent("gemini-2.5-flash", "Caption this: $text", null)
    return response.text()
  }

  @GetMapping("/describe")
  fun describe(@RequestParam photoUrl: String): ResponseEntity<String> =
    ResponseEntity.ok(client.models.generateContent("gemini-2.5-flash", "Describe this: $photoUrl", null).text())

  // Vertex AI for Java: the model and a chat session.
  @GetMapping("/vertex")
  fun vertex(@RequestParam q: String): String = vertex.generateContent(q).candidatesList.toString()

  @GetMapping("/chat")
  fun chat(@RequestParam q: String): ResponseEntity<String> {
    val session = vertex.startChat()
    return ResponseEntity.ok().body(session.sendMessage(q).toString())
  }

  // The streamed parts are written to the browser as they arrive.
  @GetMapping("/story")
  fun story(@RequestParam topic: String): SseEmitter {
    val emitter = SseEmitter()
    val chunks = client.models.generateContentStream("gemini-2.5-flash", "Tell a story about $topic", null)
    for (chunk in chunks) {
      emitter.send(chunk.text())
    }
    return emitter
  }

  @GetMapping("/chat-created")
  fun created(@RequestParam q: String): String = client.chats.create("gemini-2.5-flash").sendMessage(q).text()
}

// The Google AI client SDK for Android and Firebase's Vertex AI, shown on a screen.
class GeminiViewModel(private val model: GenerativeModel) {
  private val _uiState = MutableStateFlow("")

  suspend fun ask(prompt: String) {
    val response = model.generateContent(prompt)
    _uiState.value = response.text ?: ""
  }

  suspend fun show(view: TextView, prompt: String) {
    val chat = model.startChat()
    val reply = chat.sendMessage(prompt)
    view.text = reply.text
  }

  suspend fun stream(emitter: SseEmitter, prompt: String) {
    model.generateContentStream(prompt).collect { chunk -> emitter.send(chunk.text) }
  }
}

fun Route.firebaseRoutes() {
  get("/fb") {
    val model = Firebase.vertexAI.generativeModel("gemini-2.0-flash")
    val response = model.generateContent("Hello")
    call.respond(response.text ?: "")
  }
}

@Composable
fun Reply(model: GenerativeModel, q: String) {
  val response = model.generateContent(q)
  Text(text = response.text ?: "")
}

// The implicit `it` of forEach and collect carries the streamed text to the browser.
class StreamingScreen(private val client: Client, private val model: GenerativeModel) {
  fun forEachIt(emitter: SseEmitter, q: String) {
    client.models.generateContentStream("gemini-2.5-flash", q, null).forEach { emitter.send(it.text()) }
  }

  suspend fun collectIt(emitter: SseEmitter, q: String) {
    model.generateContentStream(q).collect { emitter.send(it.text) }
  }
}

// A function that is not a request handler: a scheduled job returns the model's output to its scheduler.
class Refresher(private val client: Client) {
  @Scheduled(fixedRate = 60000)
  fun refresh(): String {
    return client.models.generateContent("gemini-2.5-flash", "status", null).text()
  }

  @Scheduled(fixedRate = 120000)
  fun again(): String = client.models.generateContent("gemini-2.5-flash", "status", null).text()
}
