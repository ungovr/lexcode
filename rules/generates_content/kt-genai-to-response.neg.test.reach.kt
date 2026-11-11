// lexcode-expect: 0
// A real source reaching a lookalike sink. No Spring or servlet import is in the file, so the sink guards decide.
package com.example.negative.content

import android.widget.TextView
import com.google.genai.Client
import dev.langchain4j.service.AiServices

class Reach0(private val client: Client) {
  fun reach(q: String) {
    
    val t = client.models.generateContent("m", q, null)
  template.convertAndSend("queue", t)
  template.convertAndSendToUser("u", "queue", t)
  model.addAttribute("a", t)
  redirect.addFlashAttribute("a", t)
  mav.addObject("a", t)
  request.setAttribute("a", t)
  out.write(t)
  pw.println(t)
  }
}

class Reach1(model: dev.langchain4j.model.chat.ChatModel) {
  fun reach(q: String) {
    val assistant = AiServices.create(Assistant::class.java, model)
    val t = assistant.answer(q)
  template.convertAndSend("queue", t)
  template.convertAndSendToUser("u", "queue", t)
  model.addAttribute("a", t)
  redirect.addFlashAttribute("a", t)
  mav.addObject("a", t)
  request.setAttribute("a", t)
  out.write(t)
  pw.println(t)
  }
}

