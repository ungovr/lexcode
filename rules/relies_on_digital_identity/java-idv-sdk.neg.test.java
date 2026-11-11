// lexcode-expect: 0
// Signing a person in is not checking who they are: a password login, ordinary OAuth and OpenID
// Connect sign-in, Google Sign-In, Firebase email and password, and a biometric unlock prompt.
// Stripe payments and Checkout sit next to Stripe Identity without being it, and a project class
// named like a vendor's does not count without the vendor's import.
package demo.auth;

import android.app.Activity;
import androidx.biometric.BiometricPrompt;
import com.google.android.gms.auth.api.signin.GoogleSignIn;
import com.google.android.gms.auth.api.signin.GoogleSignInOptions;
import com.google.firebase.auth.FirebaseAuth;
import com.stripe.model.PaymentIntent;
import com.stripe.model.checkout.Session;
import demo.kyc.Inquiry;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;

public class SignIn {
  public Object passwordLogin(FirebaseAuth auth, String email, String password) {
    return auth.signInWithEmailAndPassword(email, password);
  }

  public Object googleSignIn(Activity activity) {
    GoogleSignInOptions options =
        new GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN).requestEmail().build();
    return GoogleSignIn.getClient(activity, options);
  }

  public Object oauthLogin(HttpSecurity http) throws Exception {
    return http.oauth2Login(login -> login.defaultSuccessUrl("/home")).build();
  }

  public BiometricPrompt.PromptInfo unlock() {
    return new BiometricPrompt.PromptInfo.Builder().setTitle("Unlock").setNegativeButtonText("Cancel").build();
  }

  public Object charge(com.stripe.param.PaymentIntentCreateParams params) throws Exception {
    return PaymentIntent.create(params);
  }

  public Object checkout(com.stripe.param.checkout.SessionCreateParams params) throws Exception {
    return Session.create(params);
  }

  public Object ownInquiry(String template) {
    return Inquiry.fromTemplate(template);
  }
}
