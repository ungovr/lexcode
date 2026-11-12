// lexcode-expect: 0
// Classes that share names with local speech engines and are not them, defined here with no
// speech-engine import: a pattern Recognizer from a tokenizer, a text-only Whisperer with a
// full method, Offline and Online recognizers that classify text, and keyword spotters named
// like the Sphinx and Vosk Android ones.
package demo.local

class Tokens(private val whisperer: Whisperer) {
    private val recognizer = Recognizer(Regex("[a-z]+"), 3)

    fun words(line: String): List<String> = recognizer.acceptWaveForm(line)

    fun quiet(text: String): String = whisperer.full(text, 3)

    fun tags(config: String): List<Any> = listOf(OfflineRecognizer(config), OnlineRecognizer(config))

    fun spotters(config: String): List<Any> =
        listOf(
            StreamSpeechRecognizer(config),
            LiveSpeechRecognizer(config),
            SpeechService(config),
            SpeechRecognizerSetup.defaultSetup(),
        )
}

// A text tokenizer that happens to be called a Recognizer and has a wave-named method.
class Recognizer(private val pattern: Regex, private val min: Int) {
    fun acceptWaveForm(line: String): List<String> =
        pattern.findAll(line).map { it.value }.filter { it.length >= min }.toList()
}

class Whisperer {
    fun full(text: String, length: Int): String = text.lowercase().take(length)
}

// Text classifiers named like sherpa-onnx recognizers.
class OfflineRecognizer(val config: String)

class OnlineRecognizer(val config: String)

// Keyword spotters named like the Sphinx and Vosk Android classes.
class StreamSpeechRecognizer(val config: String)

class LiveSpeechRecognizer(val config: String)

class SpeechService(val config: String)

object SpeechRecognizerSetup {
    fun defaultSetup(): String = "setup"
}
