// lexcode-expect: 0
// Android code that asks what the device can do, or checks a PIN, without showing a
// fingerprint or face prompt: BiometricManager availability, KeyguardManager lock state, a
// password check, and a local authenticate method.
package demo.android;

import android.app.Activity;
import android.app.KeyguardManager;
import android.content.Context;
import android.os.Bundle;
import androidx.biometric.BiometricManager;

public class LockSettingsActivity extends Activity {
  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    boolean usable = BiometricManager.from(this).canAuthenticate(BiometricManager.Authenticators.BIOMETRIC_STRONG)
        == BiometricManager.BIOMETRIC_SUCCESS;
    KeyguardManager keyguard = (KeyguardManager) getSystemService(Context.KEYGUARD_SERVICE);
    boolean secure = keyguard.isDeviceSecure();
    System.out.println(usable + " " + secure);
  }

  boolean checkPin(Pins pins, String entered) {
    return pins.authenticate(entered);
  }
}

class Pins {
  private final String stored;

  Pins(String stored) {
    this.stored = stored;
  }

  boolean authenticate(String entered) {
    return stored.equals(entered);
  }
}
