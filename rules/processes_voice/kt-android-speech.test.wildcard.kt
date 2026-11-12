// lexcode-expect: 3
// The same calls with the wildcard import, and with the recognizer under an import alias
// (a project that also uses a speech vendor's SpeechRecognizer renames one of them).
package demo.android

import android.content.Context
import android.speech.*

class WildcardCommands(private val context: Context) {
    private lateinit var recognizer: SpeechRecognizer

    fun start() {
        recognizer = SpeechRecognizer.createSpeechRecognizer(context)
        recognizer.startListening(android.content.Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH))
    }
}
