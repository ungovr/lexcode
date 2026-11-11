// lexcode-expect: 4
package com.example.tts

import android.app.Activity
import android.os.Bundle
import android.speech.tts.TextToSpeech
import java.util.Locale

class ReaderActivity : Activity() {
  private var tts: TextToSpeech? = null
  private lateinit var plain: TextToSpeech
  private lateinit var qualified: android.speech.tts.TextToSpeech

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    tts = TextToSpeech(this) { status -> tts?.setLanguage(Locale.US) }
  }

  // The platform engine reads the text aloud to the person holding the phone. The engine's voice is a model the app
  // did not write, so this is a signal, not evidence.
  fun readAloud(text: String) {
    tts?.speak(text, TextToSpeech.QUEUE_FLUSH, null, "utterance-1")
  }

  fun readQueued(text: String) {
    plain.speak(text, TextToSpeech.QUEUE_ADD, null, "utterance-2")
  }

  fun readQualified(text: String) {
    qualified.speak(text, android.speech.tts.TextToSpeech.QUEUE_FLUSH, null, "utterance-3")
  }

  fun readFlush(text: String) {
    plain.speak(text, TextToSpeech.QUEUE_FLUSH, null, null)
  }
}
