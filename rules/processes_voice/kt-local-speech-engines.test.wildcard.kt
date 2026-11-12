// lexcode-expect: 3
// The same engines with wildcard imports.
package demo.local

import edu.cmu.sphinx.api.*
import io.github.givimad.whisperjni.*
import org.vosk.*

class WildcardSpeech {
    fun vosk(model: Model): Recognizer = Recognizer(model, 16000.0f)

    fun sphinx(configuration: Configuration): StreamSpeechRecognizer = StreamSpeechRecognizer(configuration)

    fun whisper(whisper: WhisperJNI, context: Any, params: Any, samples: FloatArray): Int =
        whisper.full(context, params, samples, samples.size)
}
