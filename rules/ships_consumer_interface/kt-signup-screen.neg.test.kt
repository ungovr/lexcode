// lexcode-expect: 0
// Not a public sign-up screen: staff and settings screens, a login screen, a receiver and a
// validator that carry a registration name, a class named like a screen that is not an Android
// one, and composables that are previews or not screens.
package demo.screens

import android.app.Activity
import android.content.BroadcastReceiver
import androidx.appcompat.app.AppCompatActivity
import androidx.compose.runtime.Composable
import androidx.fragment.app.Fragment

class AdminRegisterActivity : AppCompatActivity()

class StaffSignupFragment : Fragment()

class SettingsActivity : Activity()

class LoginActivity : AppCompatActivity() {
    fun go() = Unit
}

class VehicleRegistrationValidator(val plate: String)

class RegisterReceiver : BroadcastReceiver()

class CashRegisterActivity : ReportBase()

class SignUpActivityTest : AppCompatActivity()

open class ReportBase

@Composable
fun LoginScreen(onLogin: () -> Unit) {
}

@Composable
private fun SignUpScreenPreview() {
}

@Composable
fun AdminRegistrationScreen() {
}

@Composable
fun SignUpButton(onClick: () -> Unit) {
}

fun RegisterScreen(state: Int) {
}
