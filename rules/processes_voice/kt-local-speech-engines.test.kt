// lexcode-expect: 7
// Running a speech recognizer inside the app: Vosk (the recognizer and the Android service
// that feeds it the microphone), CMU Sphinx on a server and PocketSphinx on Android,
// whisper.cpp through WhisperJNI, and sherpa-onnx.
package demo.local

import com.k2fsa.sherpa.onnx.OfflineRecognizer
import com.k2fsa.sherpa.onnx.OnlineRecognizer
import edu.cmu.pocketsphinx.SpeechRecognizerSetup
import edu.cmu.sphinx.api.Configuration
import edu.cmu.sphinx.api.LiveSpeechRecognizer
import io.github.givimad.whisperjni.WhisperJNI
import org.vosk.Model
import org.vosk.Recognizer
import org.vosk.android.SpeechService

class OnDeviceSpeech {
    fun vosk(model: Model): Recognizer = Recognizer(model, 16000.0f)

    fun voskService(recognizer: Recognizer): SpeechService = SpeechService(recognizer, 16000.0f)

    fun sphinx(configuration: Configuration): LiveSpeechRecognizer = LiveSpeechRecognizer(configuration)

    fun pocket(): Any = SpeechRecognizerSetup.defaultSetup()

    fun whisper(whisper: WhisperJNI, context: Any, params: Any, samples: FloatArray): Int =
        whisper.full(context, params, samples, samples.size)

    fun sherpa(config: Any): List<Any> = listOf(OfflineRecognizer(config), OnlineRecognizer(config))
}
