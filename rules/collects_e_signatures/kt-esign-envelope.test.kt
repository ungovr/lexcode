// lexcode-expect: 6
// Sending a document to a person for electronic signature: a DocuSign envelope, Dropbox Sign
// signature requests (plain, from a template and embedded), the earlier HelloSign client and an
// Adobe Acrobat Sign agreement (the current Java SDK's swagger-generated AgreementsApi).
package demo.esign

import com.docusign.esign.api.EnvelopesApi
import com.docusign.esign.model.EnvelopeDefinition
import com.docusign.esign.model.EnvelopeSummary
import com.dropbox.sign.api.SignatureRequestApi
import com.hellosign.sdk.HelloSignClient
import com.hellosign.sdk.resource.SignatureRequest
import io.swagger.client.api.AgreementsApi

class Signing(
    private val envelopes: EnvelopesApi,
    private val dropbox: SignatureRequestApi,
    private val agreementsApi: AgreementsApi,
) {
  fun docusign(accountId: String, definition: EnvelopeDefinition): EnvelopeSummary =
      envelopes.createEnvelope(accountId, definition)

  fun dropboxSend(request: Any): Any = dropbox.signatureRequestSend(request)

  fun dropboxTemplate(request: Any): Any = dropbox.signatureRequestSendWithTemplate(request)

  fun dropboxEmbedded(request: Any): Any = dropbox.signatureRequestCreateEmbedded(request)

  fun helloSign(client: HelloSignClient, request: SignatureRequest): Any = client.sendSignatureRequest(request)

  fun adobe(authorization: String, agreementInfo: Any): Any =
      agreementsApi.createAgreement(authorization, agreementInfo, null, null)
}
