// lexcode-expect: 4
// Listening to a person speak on Android: the platform SpeechRecognizer created and
// started, and the system speech dialog launched with the recognize-speech intent.
package demo.android;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.speech.*;

public class DictationActivity extends Activity {
  private SpeechRecognizer recognizer;

  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    recognizer = SpeechRecognizer.createSpeechRecognizer(this);
  }

  void listen(RecognitionListener listener) {
    Intent intent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
    intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
    recognizer.setRecognitionListener(listener);
    recognizer.startListening(intent);
  }

  void listenWithDialog() {
    Intent dialog = new Intent();
    dialog.setAction(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
    startActivityForResult(dialog, 7);
  }
}
