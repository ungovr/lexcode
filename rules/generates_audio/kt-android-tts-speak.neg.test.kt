// lexcode-expect: 0
// The platform engine used for something other than reading text to a user, and speak() methods that are not text to
// speech.
package com.example.negative.tts

import android.app.Activity
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import java.io.File
import java.util.Locale

class ExportActivity : Activity() {
  private var engine: TextToSpeech? = null

  // Rendering to a file the team opens later is not speech that reaches a user, and setting the language or the rate
  // is not speech either.
  fun prepare(out: File) {
    engine = TextToSpeech(this) { status ->
      if (status == TextToSpeech.SUCCESS) {
        engine?.setLanguage(Locale.US)
        engine?.setSpeechRate(0.9f)
      }
    }
    engine?.setOnUtteranceProgressListener(object : UtteranceProgressListener() {
      override fun onStart(utteranceId: String) {}
      override fun onDone(utteranceId: String) {}
      override fun onError(utteranceId: String) {}
    })
    engine?.synthesizeToFile("report", null, out, "report-1")
  }

  fun release() {
    engine?.stop()
    engine?.shutdown()
  }
}

// A speak method on a class that has nothing to do with speech synthesis.
class Parrot {
  fun speak(word: String): String = "$word!"

  fun speakTwice(word: String, times: Int): String = word.repeat(times)
}

fun greet(parrot: Parrot): String = parrot.speak("hello")

fun queue(parrot: Parrot): String = parrot.speak("QUEUE_FLUSH")
