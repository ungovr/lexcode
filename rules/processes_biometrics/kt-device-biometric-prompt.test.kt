// lexcode-expect: 6
// Asking the phone to confirm the user with a fingerprint or face: the AndroidX prompt (with
// and without an executor), the platform prompt builder in its imported and fully qualified
// forms, and the older fingerprint managers.
package demo.android

import android.hardware.biometrics.BiometricPrompt as PlatformPrompt
import android.hardware.fingerprint.FingerprintManager
import androidx.biometric.BiometricPrompt
import androidx.core.content.ContextCompat
import androidx.core.hardware.fingerprint.FingerprintManagerCompat
import androidx.fragment.app.FragmentActivity

class UnlockScreen(private val activity: FragmentActivity, private val callback: BiometricPrompt.AuthenticationCallback) {
    fun prompt(): BiometricPrompt = BiometricPrompt(activity, ContextCompat.getMainExecutor(activity), callback)

    fun promptOnMain(): BiometricPrompt = BiometricPrompt(activity, callback)

    fun platform(context: android.content.Context): PlatformPrompt.Builder = PlatformPrompt.Builder(context)

    fun qualified(context: android.content.Context) = android.hardware.biometrics.BiometricPrompt.Builder(context)

    fun legacy(manager: FingerprintManager, handler: android.os.Handler, cancel: android.os.CancellationSignal) {
        manager.authenticate(null, cancel, 0, null, handler)
    }

    fun compat(manager: FingerprintManagerCompat) {
        manager.authenticate(null, 0, null, null, null)
    }
}
