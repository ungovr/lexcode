// lexcode-expect: 3
// Asking the phone to confirm the user with a fingerprint or face: the AndroidX
// BiometricPrompt, the platform prompt builder, and the older FingerprintManager.
package demo.android;

import android.content.Context;
import android.hardware.fingerprint.FingerprintManager;
import androidx.biometric.BiometricPrompt;
import androidx.fragment.app.FragmentActivity;
import java.util.concurrent.Executor;

public class UnlockScreen {
  void prompt(FragmentActivity activity, Executor executor, BiometricPrompt.AuthenticationCallback callback) {
    BiometricPrompt prompt = new BiometricPrompt(activity, executor, callback);
    prompt.authenticate(new BiometricPrompt.PromptInfo.Builder().setTitle("Unlock").setNegativeButtonText("Cancel").build());
  }

  Object platformPrompt(Context context) {
    return new android.hardware.biometrics.BiometricPrompt.Builder(context).setTitle("Confirm");
  }

  void legacy(FingerprintManager manager, FingerprintManager.CryptoObject crypto, FingerprintManager.AuthenticationCallback callback) {
    manager.authenticate(crypto, null, 0, callback, null);
  }
}
