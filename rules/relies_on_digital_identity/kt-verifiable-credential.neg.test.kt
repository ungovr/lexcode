// lexcode-expect: 0
// "Credentials" and "verify" here mean a username and password, a signed session token or a
// stored passkey, not a verifiable credential from a person's wallet. Android's Credential
// Manager is used for saved passwords, passkeys and Google ID tokens, which is ordinary sign-in.
// The library guards are tested too: the SD-JWT and verifiable-credential class names are called
// on classes of the project's own, in a file with no Authlete and no Danubetech import.
package demo.auth

import androidx.credentials.CredentialManager
import androidx.credentials.GetCredentialRequest
import androidx.credentials.GetPasswordOption
import androidx.credentials.GetPublicKeyCredentialOption
import com.auth0.jwt.JWT
import com.auth0.jwt.algorithms.Algorithm
import com.google.android.libraries.identity.googleid.GetGoogleIdOption
import demo.sd.SDJWT
import demo.sd.SDObjectDecoder
import demo.vc.VerifiableCredential
import demo.vc.VerifiablePresentation

class Login {
  fun savedPasswordsAndPasskeys(requestJson: String): GetCredentialRequest =
      GetCredentialRequest.Builder()
          .addCredentialOption(GetPasswordOption())
          .addCredentialOption(GetPublicKeyCredentialOption(requestJson))
          .addCredentialOption(GetGoogleIdOption.Builder().setServerClientId("client").build())
          .build()

  suspend fun fetch(manager: CredentialManager, context: android.content.Context, request: GetCredentialRequest) =
      manager.getCredential(context, request)

  fun sessionToken(user: String, secret: ByteArray): String =
      JWT.create().withSubject(user).sign(Algorithm.HMAC256(secret))

  fun verifySession(token: String, secret: ByteArray): Boolean {
    JWT.require(Algorithm.HMAC256(secret)).build().verify(token)
    return true
  }

  fun ownSdJwt(serialized: String): Any {
    val parsed = SDJWT.parse(serialized)
    return SDObjectDecoder().decode(parsed)
  }

  fun ownCredential(json: String): Any = VerifiableCredential.fromJson(json)

  fun ownPresentation(map: Map<String, Any>): Any = VerifiablePresentation.fromMap(map)
}
