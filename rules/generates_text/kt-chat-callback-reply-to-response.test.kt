// lexcode-expect: 5
package com.example.text

import dev.langchain4j.model.StreamingResponseHandler
import dev.langchain4j.model.chat.ChatModel
import dev.langchain4j.model.chat.response.StreamingChatResponseHandler
import dev.langchain4j.service.TokenStream
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter
import org.springframework.web.socket.TextMessage
import org.springframework.web.socket.WebSocketSession

@RestController
class StreamController(private val model: ChatModel) {
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
