// lexcode-expect: 0
// Android classes that are not a sign-up screen for the public: a staff console, ordinary
// screens, and a plain helper that happens to be named for registration.
package demo.app;

import android.app.Activity;
import android.os.Bundle;
import androidx.appcompat.app.AppCompatActivity;
import androidx.fragment.app.Fragment;

class AdminRegisterActivity extends AppCompatActivity {
  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
  }
}

class StaffSignupFragment extends Fragment {
}

class SettingsActivity extends Activity {
}

class LoginActivity extends AppCompatActivity {
}

class VehicleRegistrationValidator {
  boolean valid(String plate) {
    return plate != null;
  }
}

class RegisterReceiver extends android.content.BroadcastReceiver {
  @Override
  public void onReceive(android.content.Context context, android.content.Intent intent) {
  }
}
