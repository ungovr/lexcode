// lexcode-expect: 0
// Device settings and build facts that do not identify the device, and a class that shares a
// method name with the advertising-id client.
package demo.android;

import android.app.Activity;
import android.content.ContentResolver;
import android.os.Build;
import android.provider.Settings;
import android.telephony.TelephonyManager;
import com.google.firebase.installations.FirebaseInstallations;
import java.util.UUID;

public class DiagnosticsActivity extends Activity {
  String describe() {
    ContentResolver resolver = getContentResolver();
    // Settings values that are not an identifier.
    String input = Settings.Secure.getString(resolver, Settings.Secure.DEFAULT_INPUT_METHOD);
    int brightness = Settings.System.getInt(resolver, Settings.System.SCREEN_BRIGHTNESS, 0);
    // Build facts shared by every unit of the model.
    String model = Build.MODEL + " " + Build.VERSION.SDK_INT;
    // Carrier state, not a subscriber or handset id.
    TelephonyManager phone = (TelephonyManager) getSystemService(TELEPHONY_SERVICE);
    String carrier = phone.getNetworkOperatorName() + phone.getSimState();
    // A per-launch token that is never stored or sent.
    String session = UUID.randomUUID().toString();
    return input + brightness + model + carrier + session;
  }

  void refreshToken() {
    // The installation token for the app's own backend calls, not the installation id.
    FirebaseInstallations.getInstance().getToken(false);
  }
}

// An ad-network wrapper of the app's own, with the client's method name and no SDK behind it.
class AdvertisingIdClient {
  static String getAdvertisingIdInfo(String placement) {
    return placement;
  }
}

class Placement {
  String lookup() {
    return AdvertisingIdClient.getAdvertisingIdInfo("banner-home");
  }
}
