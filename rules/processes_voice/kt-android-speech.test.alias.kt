// lexcode-expect: 2
// The platform recognizer under an import alias, beside a vendor's SpeechRecognizer.
package demo.android

import android.content.Context
import android.speech.SpeechRecognizer as AndroidRecognizer

class AliasedCommands(private val context: Context) {
    fun start(intent: android.content.Intent) {
        val recognizer = AndroidRecognizer.createSpeechRecognizer(context)
        recognizer.startListening(intent)
    }

    fun again(recognizer: AndroidRecognizer, intent: android.content.Intent) {
        recognizer.startListening(intent)
    }
}
