// lexcode-expect: 0
// A real source reaching a lookalike sink. The sink vendors are imported, but the receiver or method is not the sink.
package com.example.negative.content

import android.widget.TextView
import com.google.genai.Client
import dev.langchain4j.service.AiServices
import jakarta.servlet.http.HttpServletResponse
import org.springframework.messaging.simp.SimpMessagingTemplate
import org.springframework.ui.Model
import org.springframework.web.servlet.ModelAndView
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter
import org.springframework.web.socket.TextMessage

class Reach0(private val client: Client) {
  fun reach(q: String) {
    
    val t = client.models.generateContent("m", q, null)
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
    
    val t = client.models.generateContent("m", q, null)
    log.println(t)
    out.flush(t)
  }
}

class Reach1(model: dev.langchain4j.model.chat.ChatModel) {
  fun reach(q: String) {
    val assistant = AiServices.create(Assistant::class.java, model)
    val t = assistant.answer(q)
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
    val assistant = AiServices.create(Assistant::class.java, model)
    val t = assistant.answer(q)
    log.println(t)
    out.flush(t)
  }
}

