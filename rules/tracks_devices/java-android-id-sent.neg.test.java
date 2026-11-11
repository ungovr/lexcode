// lexcode-expect: 0
// The Android id read and kept on the device: compared with a value, used as a local cache key,
// shown on screen. Nothing here sends it to another host or to an analytics SDK.
package demo.android;

import android.app.Activity;
import android.content.SharedPreferences;
import android.provider.Settings;
import android.provider.Settings.Secure;
import android.widget.TextView;
import java.util.HashMap;
import java.util.Map;

public class LocalIdActivity extends Activity {
  private final Map<String, String> cache = new HashMap<>();

  // Compared with a known lab device.
  boolean isLabDevice() {
    String id = Settings.Secure.getString(getContentResolver(), Settings.Secure.ANDROID_ID);
    return "test-lab-device".equals(id);
  }

  // A key for the app's own on-device cache.
  String cached(String name) {
    String key = "cache-" + Settings.Secure.getString(getContentResolver(), Settings.Secure.ANDROID_ID);
    return cache.get(key + name);
  }

  // The same read through the imported Secure class, shown in a diagnostics screen.
  void show(TextView view) {
    String id = Secure.getString(getContentResolver(), Secure.ANDROID_ID);
    view.setText("device " + id);
  }

  // Stored in the app's own preferences.
  void remember(SharedPreferences prefs) {
    String id = Settings.Secure.getString(getContentResolver(), Settings.Secure.ANDROID_ID);
    prefs.edit().putString("device", id).apply();
  }

  // Another setting through the same call.
  String input() {
    return Settings.Secure.getString(getContentResolver(), Settings.Secure.DEFAULT_INPUT_METHOD);
  }
}
