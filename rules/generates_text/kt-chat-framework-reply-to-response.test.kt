// lexcode-expect: 11
package com.example.text

import android.widget.TextView
import de.kherud.llama.LlamaModel
import dev.langchain4j.model.chat.ChatModel
import io.github.ollama4j.OllamaAPI
import org.springframework.ai.chat.client.ChatClient
import org.springframework.http.ResponseEntity
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter

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
}

// An Android screen.
class ChatScreen(private val model: ChatModel) {
  fun show(view: TextView, q: String) {
    view.text = model.chat(q)
  }
}

// The Spring AI streaming idiom: the implicit `it` of subscribe, doOnNext and forEach carries the tokens out.
class StreamingScreen(private val chatModel: ChatModel) {
  fun subscribeIt(emitter: SseEmitter, q: String) {
    chatModel.stream(Prompt(q)).subscribe { emitter.send(it) }
  }

  fun doOnNextIt(emitter: SseEmitter, q: String) {
    chatModel.stream(Prompt(q)).doOnNext { emitter.send(it) }.blockLast()
  }

  fun collectListIt(emitter: SseEmitter, q: String) {
    chatModel.stream(Prompt(q)).collectList().block()!!.forEach { emitter.send(it) }
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
