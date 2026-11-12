// lexcode-expect: 6
// Sending a document to a person for electronic signature: a DocuSign envelope, Dropbox Sign
// signature requests (plain, from a template and embedded), the earlier HelloSign client and an
// Adobe Acrobat Sign agreement (the current Java SDK's swagger-generated AgreementsApi).
package demo.esign;

import com.docusign.esign.api.EnvelopesApi;
import com.docusign.esign.model.EnvelopeDefinition;
import com.docusign.esign.model.EnvelopeSummary;
import com.dropbox.sign.api.SignatureRequestApi;
import com.hellosign.sdk.HelloSignClient;
import com.hellosign.sdk.resource.SignatureRequest;
import io.swagger.client.api.AgreementsApi;

public class Signing {
  private final EnvelopesApi envelopes;
  private final SignatureRequestApi dropbox;
  private final AgreementsApi agreementsApi;

  public Signing(EnvelopesApi envelopes, SignatureRequestApi dropbox, AgreementsApi agreementsApi) {
    this.envelopes = envelopes;
    this.dropbox = dropbox;
    this.agreementsApi = agreementsApi;
  }

  public EnvelopeSummary docusign(String accountId, EnvelopeDefinition definition) throws Exception {
    return envelopes.createEnvelope(accountId, definition);
  }

  public Object dropboxSend(Object request) throws Exception {
    return dropbox.signatureRequestSend(request);
  }

  public Object dropboxTemplate(Object request) throws Exception {
    return dropbox.signatureRequestSendWithTemplate(request);
  }

  public Object dropboxEmbedded(Object request) throws Exception {
    return dropbox.signatureRequestCreateEmbedded(request);
  }

  public Object helloSign(HelloSignClient client, SignatureRequest request) throws Exception {
    return client.sendSignatureRequest(request);
  }

  public Object adobe(String authorization, Object agreementInfo) throws Exception {
    return agreementsApi.createAgreement(authorization, agreementInfo, null, null);
  }
}
