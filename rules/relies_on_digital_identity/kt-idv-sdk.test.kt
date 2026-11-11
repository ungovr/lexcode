// lexcode-expect: 13
// Checking who a person is with an identity-verification service: Stripe Identity on the
// server and in the Android app (the view-based sheet and the Compose one, both members of the
// interface's companion object), Onfido (server and
// app), Yoti (identity client, document scan and the older client builder), Persona, Veriff,
// Jumio and Sumsub.
package demo.kyc

import android.app.Activity
import android.content.Context
import com.jumio.sdk.JumioSDK
import com.onfido.android.sdk.capture.OnfidoFactory
import com.onfido.api.DefaultApi
import com.stripe.android.identity.IdentityVerificationSheet
import com.stripe.model.identity.VerificationReport
import com.stripe.model.identity.VerificationSession
import com.stripe.param.identity.VerificationSessionCreateParams
import com.sumsub.sns.core.SNSMobileSDK
import com.veriff.Sdk
import com.withpersona.sdk2.inquiry.Inquiry
import com.yoti.api.client.DigitalIdentityClient
import com.yoti.api.client.YotiClientBuilder
import com.yoti.api.client.docs.DocScanClient

class Verification {
  fun start(userId: String): VerificationSession {
    val params = VerificationSessionCreateParams.builder()
        .setType(VerificationSessionCreateParams.Type.DOCUMENT)
        .putMetadata("user_id", userId)
        .build()
    return VerificationSession.create(params)
  }

  fun result(reportId: String): Any = VerificationReport.retrieve(reportId)

  fun stripeSheet(activity: Activity): Any =
      IdentityVerificationSheet.create(activity, IdentityVerificationSheet.Configuration(null)) { result -> result }

  fun stripeComposeSheet(): Any =
      IdentityVerificationSheet.rememberIdentityVerificationSheet(IdentityVerificationSheet.Configuration(null)) { result -> result }

  fun onfido(context: Context): Any = OnfidoFactory.create(context)

  fun onfidoServer(apiClient: Any): Any = DefaultApi(apiClient)

  fun yoti(): Any = YotiClientBuilder.newInstance()

  fun yotiDocScan(): Any = DocScanClient.builder()

  fun yotiIdentity(): Any = DigitalIdentityClient.builder()

  fun persona(activity: Activity, templateId: String) {
    Inquiry.fromTemplate(templateId).build().start(activity, 7)
  }

  fun veriff(activity: Activity, sessionUrl: String): Any = Sdk.createLaunchIntent(activity, sessionUrl)

  fun jumio(context: Context): Any = JumioSDK(context)

  fun sumsub(token: String): Any = SNSMobileSDK.Builder(null).withAccessToken(token, null).build()
}
