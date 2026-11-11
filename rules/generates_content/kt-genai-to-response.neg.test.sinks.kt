// lexcode-expect: 0
// Gemini and AI Service calls whose output stays with the team that runs them, retrieval over a vector store, and
// a request handler that calls no model.
package com.example.negative.content

import kotlinx.coroutines.runBlocking
import com.google.ai.client.generativeai.GenerativeModel
import com.google.genai.Client
import dev.langchain4j.model.embedding.EmbeddingModel
import dev.langchain4j.service.AiServices
import dev.langchain4j.store.embedding.EmbeddingStore
import org.slf4j.LoggerFactory
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RestController
import java.io.File

private val log = LoggerFactory.getLogger("negative")

interface Triage {
  fun urgency(body: String): String
}

class Ticket(val title: String, val body: String)

interface TicketRepository {
  fun save(ticket: Ticket, tag: String)
}

// bin/risks: an engineer runs it and reads the terminal.
suspend fun main() {
  val client = Client.builder().apiKey(System.getenv("GOOGLE_API_KEY")).build()
  val result = client.models.generateContent("gemini-2.5-flash", "List the three biggest risks in this roadmap.", null)
  val text = result.text()
  println(text)
  File("risks.md").writeText(text ?: "")
  log.info("risks: {}", text)

  val model = GenerativeModel("gemini-1.5-flash", System.getenv("GEMINI_KEY"))
  val response = model.generateContent("Group these support tickets by theme.")
  System.err.println(response.text)
}

// The classification goes to an internal table the team queries.
class TicketTagger(
  private val client: Client,
  private val tickets: TicketRepository,
  chat: dev.langchain4j.model.chat.ChatModel,
) {
  private val triage: Triage = AiServices.create(Triage::class.java, chat)

  fun tag(ticket: Ticket) {
    val response = client.models.generateContent("gemini-2.5-flash", "One word tag for: ${ticket.title}", null)
    tickets.save(ticket, response.text() ?: "")
    tickets.save(ticket, triage.urgency(ticket.body))
  }
}

// Retrieval over a vector store and embeddings are not generated content.
@RestController
class SearchController(
  private val embeddings: EmbeddingModel,
  private val store: EmbeddingStore<dev.langchain4j.data.segment.TextSegment>,
) {
  @GetMapping("/search")
  fun search(q: String): ResponseEntity<List<String>> {
    val vector = embeddings.embed(q).content()
    val hits = store.search(
      dev.langchain4j.store.embedding.EmbeddingSearchRequest.builder().queryEmbedding(vector).maxResults(10).build(),
    )
    return ResponseEntity.ok(hits.matches().map { it.embedded().text() })
  }

  // A handler named after the SDK call that calls no model.
  @GetMapping("/page")
  fun page(id: Long): String = "page-$id"
}

// The last expression of a lambda is not what the handler returns.
@RestController
class BackgroundController(private val client: Client) {
  @GetMapping("/background")
  fun background(q: String): String {
    runBlocking { client.models.generateContent("gemini-2.5-flash", q, null) }
    return "queued"
  }
}
