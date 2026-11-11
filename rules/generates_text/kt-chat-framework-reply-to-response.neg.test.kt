// lexcode-expect: 0
// LangChain4j, Spring AI and Ollama4j calls whose text stays with the team that runs them, embeddings, and a streaming
// callback that only counts what it receives.
package com.example.negative.text

import de.kherud.llama.LlamaModel
import dev.langchain4j.model.chat.ChatModel
import dev.langchain4j.model.chat.response.StreamingChatResponseHandler
import dev.langchain4j.model.embedding.EmbeddingModel
import io.github.ollama4j.OllamaAPI
import org.slf4j.LoggerFactory
import org.springframework.ai.chat.client.ChatClient
import java.io.File

class Row(val id: Long, val text: String)

interface Notes {
  fun save(row: Row)
}

private val log = LoggerFactory.getLogger("negative")

// bin/triage: an engineer runs it and reads the terminal, a file and the log.
class Triage(
  private val chatModel: ChatModel,
  private val chatClient: ChatClient,
  private val ollamaApi: OllamaAPI,
  private val llamaModel: LlamaModel,
  private val embeddings: EmbeddingModel,
  private val notes: Notes,
) {
  fun run(id: Long, ticket: String) {
    val tag = chatModel.chat("One word tag for: $ticket")
    println(tag)
    File("tags.txt").appendText(tag)
    log.info("tag {}: {}", id, tag)
    notes.save(Row(id, chatClient.prompt().user(ticket).call().content() ?: ""))
    notes.save(Row(id, ollamaApi.generate("llama3", ticket, false, null).response))
    notes.save(Row(id, llamaModel.complete(ticket)))
  }

  // Embeddings are vectors, not text.
  fun vectorOf(text: String): List<Float> = embeddings.embed(text).content().vectorAsList()

  // A streaming callback that only counts the tokens it is given.
  fun counter(): StreamingChatResponseHandler {
    var tokens = 0
    return object : StreamingChatResponseHandler {
      override fun onPartialResponse(partialResponse: String) {
        tokens += 1
      }

      override fun onCompleteResponse(response: dev.langchain4j.model.chat.response.ChatResponse) {
        log.info("{} tokens", tokens)
      }

      override fun onError(error: Throwable) {}
    }
  }
}
