// lexcode-expect: 12
// Checking who a person is with an identity-verification service: Stripe Identity on the
// server and in the Android app, Onfido (server and app), Yoti (identity client, document scan
// and the older client builder), Persona, Veriff, Jumio and Sumsub.
package demo.kyc;

import android.app.Activity;
import android.content.Context;
import com.jumio.sdk.JumioSDK;
import com.onfido.android.sdk.capture.OnfidoFactory;
import com.onfido.api.DefaultApi;
import com.stripe.android.identity.IdentityVerificationSheet;
import com.stripe.model.identity.VerificationReport;
import com.stripe.model.identity.VerificationSession;
import com.stripe.param.identity.VerificationSessionCreateParams;
import com.sumsub.sns.core.SNSMobileSDK;
import com.veriff.Sdk;
import com.withpersona.sdk2.inquiry.Inquiry;
import com.yoti.api.client.DigitalIdentityClient;
import com.yoti.api.client.YotiClientBuilder;
import com.yoti.api.client.docs.DocScanClient;

public class Verification {
  public VerificationSession start(String userId) throws Exception {
    VerificationSessionCreateParams params = VerificationSessionCreateParams.builder()
        .setType(VerificationSessionCreateParams.Type.DOCUMENT)
        .putMetadata("user_id", userId)
        .build();
    return VerificationSession.create(params);
  }

  public Object result(String reportId) throws Exception {
    return VerificationReport.retrieve(reportId);
  }

  public Object stripeSheet(Activity activity) {
    return IdentityVerificationSheet.create(activity, null, result -> { });
  }

  public Object onfido(Context context) {
    return OnfidoFactory.create(context);
  }

  public Object onfidoServer(Object apiClient) {
    return new DefaultApi(apiClient);
  }

  public Object yoti() {
    return YotiClientBuilder.newInstance();
  }

  public Object yotiDocScan() {
    return DocScanClient.builder();
  }

  public Object yotiIdentity() {
    return DigitalIdentityClient.builder();
  }

  public void persona(Activity activity, String templateId) {
    Inquiry.fromTemplate(templateId).build().start(activity, 7);
  }

  public Object veriff(Activity activity, String sessionUrl) {
    return Sdk.createLaunchIntent(activity, sessionUrl);
  }

  public Object jumio(Context context) {
    return new JumioSDK(context);
  }

  public Object sumsub(String token) {
    return new SNSMobileSDK.Builder(null).withAccessToken(token, null).build();
  }
}
