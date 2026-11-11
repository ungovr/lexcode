// lexcode-expect: 0
// A real source reaching a lookalike sink. No Spring or servlet import is in the file, so the sink guards decide.
package com.example.negative.audio

import android.widget.TextView
import com.aallam.openai.client.OpenAI

class Reach0(private val openAI: OpenAI) {
  fun reach(q: String) {
    
    val t = openAI.speech(null)
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
  t.forEach { emitter.send("tick") }
  t.collect { emitter.send("tick") }
  audioBuf.write(t, 0, 1)
  }
}

