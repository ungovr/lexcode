// lexcode-expect: 0
// The platform engine used for something other than reading text to a user, and speak() methods that are not text to speech.
package com.example.negative.tts;

import android.app.Activity;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import java.io.File;
import java.util.Locale;

public class ExportActivity extends Activity {
  private TextToSpeech engine;

  // Rendering to a file the team opens later is not speech that reaches a user. Setting the
  // language or the speech rate is not speech either.
  void prepare(File out) {
    engine = new TextToSpeech(this, status -> {
      if (status == TextToSpeech.SUCCESS) {
        engine.setLanguage(Locale.US);
        engine.setSpeechRate(0.9f);
      }
    });
    engine.setOnUtteranceProgressListener(new UtteranceProgressListener() {
      @Override public void onStart(String utteranceId) {}
      @Override public void onDone(String utteranceId) {}
      @Override public void onError(String utteranceId) {}
    });
  }

  void release() {
    engine.stop();
    engine.shutdown();
  }

  // A speak method on a class that has nothing to do with speech synthesis.
  static class Parrot {
    String speak(String word) {
      return word + "!";
    }
  }

  static String greet(Parrot parrot) {
    return parrot.speak("hello");
  }
}
