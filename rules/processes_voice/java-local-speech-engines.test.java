// lexcode-expect: 4
// Recognizing speech with engines that run inside the app: Vosk, CMU Sphinx, whisper.cpp
// through WhisperJNI, and sherpa-onnx.
package demo.local;

import com.k2fsa.sherpa.onnx.OfflineRecognizer;
import com.k2fsa.sherpa.onnx.OfflineRecognizerConfig;
import edu.cmu.sphinx.api.Configuration;
import edu.cmu.sphinx.api.StreamSpeechRecognizer;
import io.github.givimad.whisperjni.WhisperContext;
import io.github.givimad.whisperjni.WhisperFullParams;
import io.github.givimad.whisperjni.WhisperJNI;
import java.io.InputStream;
import java.nio.file.Path;
import org.vosk.Model;
import org.vosk.Recognizer;

public class OfflineDictation {
  public String vosk(Path modelDir, byte[] pcm) throws Exception {
    try (Model model = new Model(modelDir.toString());
        Recognizer recognizer = new Recognizer(model, 16000.0f)) {
      recognizer.acceptWaveForm(pcm, pcm.length);
      return recognizer.getFinalResult();
    }
  }

  public void sphinx(InputStream stream) throws Exception {
    Configuration configuration = new Configuration();
    StreamSpeechRecognizer recognizer = new StreamSpeechRecognizer(configuration);
    recognizer.startRecognition(stream);
  }

  public int whisper(WhisperJNI whisper, WhisperContext context, float[] samples) {
    return whisper.full(context, new WhisperFullParams(), samples, samples.length);
  }

  public OfflineRecognizer sherpa(OfflineRecognizerConfig config) {
    return new OfflineRecognizer(config);
  }
}
