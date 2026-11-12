// lexcode-expect: 7
// Android sign-up screens: activities and fragments for registering an account (with or without
// a constructor, with a base class of the app's own), and Compose screens.
package demo.screens

import androidx.appcompat.app.AppCompatActivity
import androidx.compose.runtime.Composable
import androidx.fragment.app.DialogFragment
import androidx.fragment.app.Fragment

class SignUpActivity : AppCompatActivity() {
    fun go() = Unit
}

class RegisterFragment(val source: String) : Fragment()

class CreateAccountActivity : BaseAppActivity(), Listener

class RegistrationDialog : DialogFragment()

open class BaseAppActivity : AppCompatActivity()

interface Listener

@Composable
internal fun SignUpScreen(state: Int) {
}

@Composable
fun RegisterScreen(state: Int): Unit {
}

@Composable
fun CreateAccountPage(state: Int) = Unit
