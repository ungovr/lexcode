// lexcode-expect: 0
// A real source reaching a lookalike sink. No Spring or servlet import is in the file, so the sink guards decide.
package com.example.negative.image

import android.widget.TextView
import com.openai.client.OpenAIClient
import com.openai.models.images.ImageGenerateParams

class Reach0(private val client: OpenAIClient) {
  fun reach(q: String) {
    
    val t = client.images().generate(ImageGenerateParams.builder().build())
  template.convertAndSend("queue", t)
  template.convertAndSendToUser("u", "queue", t)
  model.addAttribute("a", t)
  redirect.addFlashAttribute("a", t)
  mav.addObject("a", t)
  request.setAttribute("a", t)
  out.write(t)
  pw.println(t)
  t.also { emitter.send("tick") }
  t?.also { emitter.send("tick") }
  view.load(t)
  }
}

