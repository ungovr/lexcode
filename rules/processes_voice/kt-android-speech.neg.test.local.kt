// lexcode-expect: 0
// A voice-command simulator for tests, with classes named like Android's speech classes and
// no android.speech import: a recognizer with createSpeechRecognizer and startListening, and
// an intent holder with an ACTION_RECOGNIZE_SPEECH constant of its own.
package demo.simulator

class SpeechRecognizer {
    companion object {
        fun createSpeechRecognizer(script: String): SpeechRecognizer = SpeechRecognizer()

        fun createOnDeviceSpeechRecognizer(script: String): SpeechRecognizer = SpeechRecognizer()
    }

    fun startListening(script: String) {
        println(script)
    }
}

object RecognizerIntent {
    const val ACTION_RECOGNIZE_SPEECH = "simulator.recognize"
}

class Harness(private val recognizer: SpeechRecognizer) {
    fun run(): String {
        val fresh = SpeechRecognizer.createSpeechRecognizer("hello")
        val onDevice = SpeechRecognizer.createOnDeviceSpeechRecognizer("hello")
        recognizer.startListening(RecognizerIntent.ACTION_RECOGNIZE_SPEECH)
        fresh.startListening("again")
        return onDevice.toString()
    }
}
