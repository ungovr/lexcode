// lexcode-expect: 0
// A login screen with no biometric import whose own types share the platform's names: a local
// BiometricPrompt with a Builder, and a local FingerprintManager with an authenticate method.
package demo.login

class BiometricPrompt(val title: String, val subtitle: String) {
    class Builder(private val context: Any) {
        fun build(): BiometricPrompt = BiometricPrompt("title", "subtitle")
    }
}

class FingerprintManager {
    fun authenticate(pin: String): Boolean = pin.isNotEmpty()
}

class FingerprintManagerCompat {
    fun authenticate(pin: String): Boolean = pin.isNotEmpty()
}

class PinScreen(private val manager: FingerprintManager, private val compat: FingerprintManagerCompat) {
    fun open(context: Any): Any = BiometricPrompt.Builder(context).build()

    fun fixed(): Any = BiometricPrompt("Sign in", "Enter your PIN")

    fun confirm(pin: String): Boolean = manager.authenticate(pin) && compat.authenticate(pin)

    fun check(other: FingerprintManager, pin: String): Boolean = other.authenticate(pin)
}
