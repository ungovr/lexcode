// lexcode-expect: 0
// Signing a person in is not checking who they are: a password login, OAuth and OpenID Connect
// sign-in, Google Sign-In, Firebase email and password, and a biometric unlock prompt. Stripe
// payments and Checkout sit next to Stripe Identity without being it. The vendor guards are
// tested too: this file imports one class of a vendor's package (Yoti's YotiClient, unused, which no Yoti guard names) and calls the generic names
// VerificationSession.create, VerificationReport.retrieve, IdentityVerificationSheet.create,
// IdentityVerificationSheet.rememberIdentityVerificationSheet, OnfidoFactory.create, DefaultApi (the default name of every
// OpenAPI-generated client), Inquiry.fromTemplate, Sdk.createLaunchIntent,
// DigitalIdentityClient.builder, DocScanClient.builder, YotiClientBuilder.newInstance, JumioSDK and
// SNSMobileSDK.Builder on classes of the project's own. Without each call's own vendor import
// none of them is a vendor call.
package demo.auth

import android.app.Activity
import androidx.biometric.BiometricPrompt
import com.google.android.gms.auth.api.signin.GoogleSignIn
import com.google.android.gms.auth.api.signin.GoogleSignInOptions
import com.google.firebase.auth.FirebaseAuth
import com.stripe.model.PaymentIntent
import com.stripe.model.checkout.Session
import com.yoti.api.client.YotiClient
import demo.camera.Sdk
import demo.generated.DefaultApi
import demo.kyc.DigitalIdentityClient
import demo.kyc.DocScanClient
import demo.kyc.Inquiry
import demo.kyc.JumioSDK
import demo.kyc.OnfidoFactory
import demo.kyc.SNSMobileSDK
import demo.kyc.VerificationReport
import demo.kyc.YotiClientBuilder
import demo.sms.VerificationSession
import demo.ui.IdentityVerificationSheet
import org.springframework.security.config.annotation.web.builders.HttpSecurity

class SignIn {
  fun passwordLogin(auth: FirebaseAuth, email: String, password: String) =
      auth.signInWithEmailAndPassword(email, password)

  fun googleSignIn(activity: Activity): Any {
    val options = GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN).requestEmail().build()
    return GoogleSignIn.getClient(activity, options)
  }

  fun oauthLogin(http: HttpSecurity): Any = http.oauth2Login { login -> login.defaultSuccessUrl("/home") }.build()

  fun unlock(): BiometricPrompt.PromptInfo =
      BiometricPrompt.PromptInfo.Builder().setTitle("Unlock").setNegativeButtonText("Cancel").build()

  fun charge(params: com.stripe.param.PaymentIntentCreateParams): Any = PaymentIntent.create(params)

  fun checkout(params: com.stripe.param.checkout.SessionCreateParams): Any = Session.create(params)

  fun ownVerification(): Any = VerificationSession.create("sms")

  fun ownReport(): Any = VerificationReport.retrieve("report-1")

  fun ownSheet(activity: Activity): Any = IdentityVerificationSheet.create(activity, null) { result -> result }

  fun ownRememberedSheet(): Any = IdentityVerificationSheet.rememberIdentityVerificationSheet(null) { result -> result }

  fun ownOnfido(context: android.content.Context): Any = OnfidoFactory.create(context)

  fun ownGeneratedClient(client: Any): Any = DefaultApi(client)

  fun ownInquiry(template: String): Any = Inquiry.fromTemplate(template)

  fun ownCamera(activity: Activity, url: String): Any = Sdk.createLaunchIntent(activity, url)

  fun ownIdentity(): Any = DigitalIdentityClient.builder()

  fun ownDocScan(): Any = DocScanClient.builder()

  fun ownYoti(): Any = YotiClientBuilder.newInstance()

  fun ownJumio(context: android.content.Context): Any = JumioSDK(context)

  fun ownSumsub(activity: Activity): Any = SNSMobileSDK.Builder(activity).build()
}
