// lexcode-expect: 0
// Model calls whose text stays with the team that runs them, embeddings and other non-text calls, and lookalike
// receivers in a file that does import the vendors (so only the receiver and the sink decide).
package com.example.negative.text

import kotlinx.coroutines.runBlocking
import com.openai.client.OpenAIClient
import com.openai.models.chat.completions.ChatCompletionCreateParams
import com.anthropic.client.AnthropicClient
import com.aallam.openai.client.OpenAI
import com.azure.ai.inference.ChatCompletionsClient
import aws.sdk.kotlin.services.bedrockruntime.BedrockRuntimeClient
import dev.langchain4j.model.embedding.EmbeddingModel
import org.springframework.ai.chat.client.ChatClient
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RestController
import java.io.File
import org.slf4j.LoggerFactory

class Row(val id: Long, val text: String)

interface Notes {
  fun save(row: Row)
}

class TicketDesk {
  fun chat(text: String): String = text
  fun generate(text: String): String = text
  fun complete(text: String): String = text
  fun call(text: String): String = text
  fun stream(text: String): String = text
}

private val log = LoggerFactory.getLogger("negative")

// bin/summarize: an engineer runs it and reads the terminal, a file and the log.
fun main(client: OpenAIClient, bedrock: BedrockRuntimeClient, notes: Notes) {
  val completion = client.chat().completions().create(ChatCompletionCreateParams.builder().build())
  val text = completion.choices()[0].message().content().orElse("")
  println(text)
  File("summary.md").writeText(text)
  log.info("summary: {}", text)
  notes.save(Row(1, text))
}

// Receivers that are not models, in files that import the vendors.
@RestController
class ReceiverController(
  private val desk: TicketDesk,
  private val inference: ChatCompletionsClient,
  private val embeddings: EmbeddingModel,
  private val aallam: OpenAI,
  private val chatClient: ChatClient,
  private val anthropic: AnthropicClient,
) {
  // The help desk is an in-house class; its receiver name is not a model's.
  @GetMapping("/desk/chat")
  fun chat(text: String): String = desk.chat(text)

  @GetMapping("/desk/generate")
  fun generate(text: String): String = desk.generate(text)

  @GetMapping("/desk/call")
  fun call(text: String): ResponseEntity<String> = ResponseEntity.ok(desk.call(text))

  @GetMapping("/desk/stream")
  fun stream(text: String): String = desk.stream(text)

  @GetMapping("/desk/complete")
  fun complete(text: String): String = desk.complete(text)

  // An Azure Inference embeddings call is not a chat completion, and a vector search is not text generation.
  @GetMapping("/search")
  fun search(q: String): List<Float> = embeddings.embed(q).content().vectorAsList()

  // A chat client whose answer goes to the log only.
  @GetMapping("/audit")
  fun audit(q: String) {
    log.info("audit: {}", chatClient.prompt().user(q).call().content())
  }

  // Anthropic token counting is a number, not text.
  @GetMapping("/tokens")
  fun tokens(q: String): Long = anthropic.messages().countTokens(q).inputTokens()
}

// The last expression of a lambda is not what the handler returns.
@RestController
class BackgroundController(private val model: dev.langchain4j.model.chat.ChatModel) {
  @GetMapping("/background")
  fun background(q: String): String {
    runBlocking { model.chat(q) }
    return "queued"
  }
}
