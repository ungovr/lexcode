// lexcode-expect: 3
package com.example.tts;

import android.app.Activity;
import android.os.Bundle;
import android.speech.tts.TextToSpeech;
import java.util.Locale;

public class ReaderActivity extends Activity {
  private TextToSpeech tts;
  private android.speech.tts.TextToSpeech qualified;

  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    tts = new TextToSpeech(this, status -> tts.setLanguage(Locale.US));
  }

  // The platform engine reads the text aloud to the person holding the phone. The engine's
  // voice is a model the app did not write, so this is a signal, not evidence.
  void readAloud(String text) {
    tts.speak(text, TextToSpeech.QUEUE_FLUSH, null, "utterance-1");
  }

  void readQueued(String text) {
    tts.speak(text, TextToSpeech.QUEUE_ADD, null, "utterance-2");
  }

  void readQualified(String text) {
    qualified.speak(text, android.speech.tts.TextToSpeech.QUEUE_FLUSH, null, "utterance-3");
  }
}
