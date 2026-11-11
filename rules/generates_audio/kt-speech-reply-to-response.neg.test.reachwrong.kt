// lexcode-expect: 0
// A real source reaching a lookalike sink. The sink vendors are imported, but the receiver or method is not the sink.
package com.example.negative.audio

import android.media.AudioTrack
import android.widget.TextView
import com.aallam.openai.client.OpenAI
import jakarta.servlet.http.HttpServletResponse
import org.springframework.messaging.simp.SimpMessagingTemplate
import org.springframework.ui.Model
import org.springframework.web.servlet.ModelAndView
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter
import org.springframework.web.socket.TextMessage

class Reach0(private val openAI: OpenAI) {
  fun reach(q: String) {
    
    val t = openAI.speech(null)
  mailer.send(t)
  cache.addAttribute("a", t)
  model.removeAttribute(t)
  counter.value = t
  file.writer.write(t)
  response.writer.flush(t)
  file.outputStream.write(t)
  response.outputStream.flush(t)
  buf.write(t, 0, 1)
  }

  fun servlet(q: String, response: HttpServletResponse) {
    
    val t = openAI.speech(null)
    log.println(t)
    out.flush(t)
  }
}

