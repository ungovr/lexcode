// lexcode-expect: 4
// Android screens that let a member of the public create an account.
package demo.app;

import android.app.Activity;
import android.os.Bundle;
import androidx.appcompat.app.AppCompatActivity;
import androidx.fragment.app.Fragment;
import androidx.fragment.app.FragmentActivity;

class SignUpActivity extends AppCompatActivity {
  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
  }
}

class RegisterFragment extends Fragment {
}

class CreateAccountActivity extends Activity {
}

class RegistrationFlowActivity extends FragmentActivity {
}
