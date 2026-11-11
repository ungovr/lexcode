// lexcode-expect: 0
// The vendors are imported, but each call is not a generating call (list, count, embed, stop), or its receiver is not a model.
package com.example.negative.audio

import com.microsoft.cognitiveservices.speech.SpeechSynthesizer
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RestController

class Acme

@RestController
class H0(private val acme: Acme) {
  @GetMapping("/h0")
  fun reply(x: String): String = synth.StopSpeaking(x)
}

@RestController
class H1(private val acme: Acme) {
  @GetMapping("/h1")
  fun reply(x: String): String = synth.GetVoicesAsync(x)
}
