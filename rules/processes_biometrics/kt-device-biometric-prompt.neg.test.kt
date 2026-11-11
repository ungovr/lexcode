// lexcode-expect: 0
// Android code that asks what the device can do, or checks a PIN, without showing a
// fingerprint or face prompt: BiometricManager availability, KeyguardManager lock state, a
// password check, a Compose screen that is named BiometricPrompt and draws its own button, and a
// local authenticate method called on a receiver.
package demo.android

import android.app.Activity
import android.app.KeyguardManager
import android.content.Context
import android.os.Bundle
import androidx.biometric.BiometricManager
import androidx.compose.material3.Button
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable

class LockSettingsActivity : Activity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val usable = BiometricManager.from(this).canAuthenticate(BiometricManager.Authenticators.BIOMETRIC_STRONG) ==
            BiometricManager.BIOMETRIC_SUCCESS
        val keyguard = getSystemService(Context.KEYGUARD_SERVICE) as KeyguardManager
        println("$usable ${keyguard.isDeviceSecure}")
    }

    fun checkPin(pins: Pins, entered: String): Boolean = pins.authenticate(entered)
}

class Pins(private val stored: String) {
    fun authenticate(entered: String): Boolean = stored == entered
}

// A screen of the app's own, not the AndroidX class.
@Composable
fun BiometricPrompt(onConfirm: () -> Unit, onCancel: () -> Unit) {
    Button(onClick = onConfirm) { Text("Use device unlock") }
    Button(onClick = onCancel) { Text("Cancel") }
}

@Composable
fun Settings(onConfirm: () -> Unit) {
    BiometricPrompt(onConfirm, onConfirm)
}
