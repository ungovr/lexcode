// lexcode-expect: 0
// A real source reaching a lookalike sink. The sink vendors are imported, but the receiver or method is not the sink.
package com.example.negative.text

import android.widget.TextView
import com.openai.client.OpenAIClient
import com.openai.models.chat.completions.ChatCompletionCreateParams
import dev.langchain4j.model.chat.ChatModel
import jakarta.servlet.http.HttpServletResponse
import org.springframework.messaging.simp.SimpMessagingTemplate
import org.springframework.ui.Model
import org.springframework.web.servlet.ModelAndView
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter
import org.springframework.web.socket.TextMessage

class Reach0(private val model: ChatModel) {
  fun reach(q: String) {
    
    val t = model.chat(q)
  mailer.send(t)
  cache.addAttribute("a", t)
  model.removeAttribute(t)
  counter.value = t
  file.writer.write(t)
  response.writer.flush(t)
  file.outputStream.write(t)
  response.outputStream.flush(t)
  }

  fun servlet(q: String, response: HttpServletResponse) {
    
    val t = model.chat(q)
    log.println(t)
    out.flush(t)
  }
}

class Reach1(private val openai: OpenAIClient) {
  fun reach(q: String) {
    
    val t = openai.chat().completions().create(ChatCompletionCreateParams.builder().build())
  mailer.send(t)
  cache.addAttribute("a", t)
  model.removeAttribute(t)
  counter.value = t
  file.writer.write(t)
  response.writer.flush(t)
  file.outputStream.write(t)
  response.outputStream.flush(t)
  }

  fun servlet(q: String, response: HttpServletResponse) {
    
    val t = openai.chat().completions().create(ChatCompletionCreateParams.builder().build())
    log.println(t)
    out.flush(t)
  }
}

