// lexcode-expect: 13
package com.example.text

import android.widget.TextView
import de.kherud.llama.LlamaModel
import dev.langchain4j.model.StreamingResponseHandler
import dev.langchain4j.model.chat.ChatModel
import dev.langchain4j.model.chat.response.StreamingChatResponseHandler
import dev.langchain4j.service.TokenStream
import io.github.ollama4j.OllamaAPI
import org.springframework.ai.chat.client.ChatClient
import org.springframework.http.ResponseEntity
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter
import org.springframework.web.socket.TextMessage
import org.springframework.web.socket.WebSocketSession

@RestController
class FrameworkController(
  private val chatModel: ChatModel,
  private val model: ChatModel,
  private val chatClient: ChatClient,
  private val ollamaApi: OllamaAPI,
  private val llamaModel: LlamaModel,
) {
  // LangChain4j chat model: a call, the Kotlin builder form, and generate.
  @GetMapping("/lc4j")
  fun lc4j(@RequestParam q: String): String = chatModel.chat(q)

  @GetMapping("/lc4j-dsl")
  suspend fun lc4jDsl(@RequestParam q: String): String = chatModel.chat { messages += userMessage(q) }.toString()

  @GetMapping("/generate")
  fun generate(@RequestParam q: String): ResponseEntity<String> = ResponseEntity.ok(model.generate(q))

  // Spring AI: the ChatClient fluent call and the chat model.
  @GetMapping("/spring-ai")
  fun springAi(@RequestParam q: String): String = chatClient.prompt().user(q).call().content()!!

  @GetMapping("/spring-model")
  fun springModel(@RequestParam q: String): String = chatModel.call(q)

  // Ollama4j and java-llama.cpp.
  @GetMapping("/ollama")
  fun ollama(@RequestParam q: String): ResponseEntity<String> =
    ResponseEntity.ok(ollamaApi.generate("llama3", q, false, null).response)

  @GetMapping("/llama")
  fun llama(@RequestParam q: String): String = llamaModel.complete(q)

  // Streaming callbacks: the token a handler receives is model text.
  @GetMapping("/stream")
  fun stream(@RequestParam q: String, emitter: SseEmitter, tokens: TokenStream) {
    tokens.onPartialResponse { partial -> emitter.send(partial) }.start()
  }

  fun socket(session: WebSocketSession, tokens: TokenStream) {
    tokens.onPartialResponse { session.sendMessage(TextMessage(it)) }.start()
  }

  fun handler(emitter: SseEmitter): StreamingChatResponseHandler = object : StreamingChatResponseHandler {
    override fun onPartialResponse(partialResponse: String) {
      emitter.send(partialResponse)
    }

    override fun onCompleteResponse(response: dev.langchain4j.model.chat.response.ChatResponse) {}
    override fun onError(error: Throwable) {}
  }

  fun callback(emitter: SseEmitter, q: String) {
    model.chat(q) { token -> emitter.send(token) }
  }

  fun legacy(emitter: SseEmitter): StreamingResponseHandler<String> = object : StreamingResponseHandler<String> {
    override fun onNext(token: String) {
      emitter.send(token)
    }
  }
}

// An Android screen.
class ChatScreen(private val model: ChatModel) {
  fun show(view: TextView, q: String) {
    view.text = model.chat(q)
  }
}

// A function that is not a request handler: a scheduled job returns the model's output to its scheduler.
class Refresher(private val model: ChatModel) {
  @Scheduled(fixedRate = 60000)
  fun refresh(): String {
    return model.chat("status")
  }

  @Scheduled(fixedRate = 120000)
  fun again(): String = model.chat("status")
}
