// lexcode-expect: 0
// A real source reaching a lookalike sink. No Spring or servlet import is in the file, so the sink guards decide.
package com.example.negative.video

import android.widget.TextView
import com.google.genai.Client

class Reach0(private val client: Client) {
  fun reach(q: String) {
    
    val t = client.models.generateVideos("v", q, null, null)
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
  }
}

