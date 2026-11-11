// lexcode-expect: 0
// A real source reaching a lookalike sink. No Spring or servlet import is in the file, so the sink guards decide.
package com.example.negative.text

import android.widget.TextView
import com.openai.client.OpenAIClient
import com.openai.models.chat.completions.ChatCompletionCreateParams
import dev.langchain4j.model.chat.ChatModel

class Reach0(private val model: ChatModel) {
  fun reach(q: String) {
    
    val t = model.chat(q)
  template.convertAndSend("queue", t)
  template.convertAndSendToUser("u", "queue", t)
  model.addAttribute("a", t)
  redirect.addFlashAttribute("a", t)
  mav.addObject("a", t)
  request.setAttribute("a", t)
  }
}

class Reach1(private val openai: OpenAIClient) {
  fun reach(q: String) {
    
    val t = openai.chat().completions().create(ChatCompletionCreateParams.builder().build())
  template.convertAndSend("queue", t)
  template.convertAndSendToUser("u", "queue", t)
  model.addAttribute("a", t)
  redirect.addFlashAttribute("a", t)
  mav.addObject("a", t)
  request.setAttribute("a", t)
  }
}

