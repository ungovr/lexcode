// lexcode-expect: 5
// Starting Android speech recognition from Kotlin: a recognizer created for the device, one
// created on the device, listening started on a typed property and a parameter, and the
// recognize-speech intent that opens the system voice dialog.
package demo.android

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer

class VoiceCommands(private val context: Context) {
    private lateinit var recognizer: SpeechRecognizer

    fun start() {
        recognizer = SpeechRecognizer.createSpeechRecognizer(context)
        recognizer.startListening(Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH))
    }

    fun restart(listener: SpeechRecognizer, intent: Intent) {
        listener.startListening(intent)
    }

    fun offline(): SpeechRecognizer = SpeechRecognizer.createOnDeviceSpeechRecognizer(context)
}
