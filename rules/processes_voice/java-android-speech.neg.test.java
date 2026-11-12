// lexcode-expect: 0
// Android speech output and non-speech intents that sit beside speech recognition: the
// text-to-speech engine reading typed text, a search intent, a camera intent, and local
// classes with a startListening method of their own.
package demo.android;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.provider.MediaStore;
import android.speech.tts.TextToSpeech;
import java.util.Locale;

public class ReaderActivity extends Activity implements TextToSpeech.OnInitListener {
  private TextToSpeech tts;

  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    tts = new TextToSpeech(this, this);
  }

  @Override
  public void onInit(int status) {
    tts.setLanguage(Locale.US);
    tts.speak("Chapter one", TextToSpeech.QUEUE_FLUSH, null, "chapter-1");
  }

  void openCamera() {
    startActivityForResult(new Intent(MediaStore.ACTION_IMAGE_CAPTURE), 1);
  }

  void search(String query) {
    Intent intent = new Intent(Intent.ACTION_WEB_SEARCH);
    intent.putExtra("query", query);
    startActivity(intent);
  }
}

// A local metronome with a listening method; no speech service is involved.
class Metronome {
  private final Ticker ticker;

  Metronome(Ticker ticker) {
    this.ticker = ticker;
  }

  void begin() {
    ticker.startListening();
  }
}

interface Ticker {
  void startListening();
}
