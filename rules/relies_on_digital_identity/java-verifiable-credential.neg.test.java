// lexcode-expect: 0
// "Credentials" and "verify" here mean a username and password, a signed session token or a
// stored passkey, not a verifiable credential from a person's wallet. Android's Credential
// Manager is used for saved passwords and Google ID tokens, which is ordinary sign-in.
package demo.auth;

import androidx.credentials.CredentialManager;
import androidx.credentials.GetCredentialRequest;
import androidx.credentials.GetPasswordOption;
import androidx.credentials.GetPublicKeyCredentialOption;
import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.google.android.libraries.identity.googleid.GetGoogleIdOption;

public class Login {
  public GetCredentialRequest savedPasswordsAndPasskeys(String requestJson) {
    return new GetCredentialRequest.Builder()
        .addCredentialOption(new GetPasswordOption())
        .addCredentialOption(new GetPublicKeyCredentialOption(requestJson))
        .addCredentialOption(new GetGoogleIdOption.Builder().setServerClientId("client").build())
        .build();
  }

  public Object fetch(CredentialManager manager, android.content.Context context, GetCredentialRequest request) {
    return manager.getCredentialAsync(context, request, null, null, null);
  }

  public String sessionToken(String user, byte[] secret) {
    return JWT.create().withSubject(user).sign(Algorithm.HMAC256(secret));
  }

  public boolean verifySession(String token, byte[] secret) {
    JWT.require(Algorithm.HMAC256(secret)).build().verify(token);
    return true;
  }
}
