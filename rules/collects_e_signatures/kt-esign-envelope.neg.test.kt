// lexcode-expect: 0
// Sending, signing and checking things that are not a person's electronic signature on a
// document: an email message, a cryptographic signature over bytes, a JWT, a PDF built without a
// signature, and project classes that share a vendor's method names. The vendor guards are
// tested too: this file imports a class of Dropbox Sign's package that no guard names
// (AccountApi, unused) and calls the generic names createEnvelope, createAgreement,
// signatureRequestSend and sendSignatureRequest on project objects. Without each call's own
// vendor import none of them is an e-signature call.
package demo.docs

import com.dropbox.sign.api.AccountApi
import com.itextpdf.kernel.pdf.PdfDocument
import com.itextpdf.kernel.pdf.PdfWriter
import demo.mail.MailClient
import demo.sales.AgreementsApi
import demo.sales.EnvelopesApi
import demo.sales.SignatureRequestApi
import io.jsonwebtoken.Jwts
import java.security.PrivateKey
import java.security.Signature
import javax.mail.Message
import javax.mail.Transport

class Documents {
  fun mail(message: Message) {
    Transport.send(message)
  }

  fun sign(key: PrivateKey, data: ByteArray): ByteArray {
    val signature = Signature.getInstance("SHA256withRSA")
    signature.initSign(key)
    signature.update(data)
    return signature.sign()
  }

  fun token(key: javax.crypto.SecretKey): String = Jwts.builder().subject("someone").signWith(key).compact()

  fun plainPdf(path: String): PdfDocument = PdfDocument(PdfWriter(path))

  fun internalEnvelope(api: EnvelopesApi, body: String): Any = api.createEnvelope("account", body)

  fun internalAgreement(api: AgreementsApi, body: String): Any = api.createAgreement("token", body, null, null)

  fun internalMail(client: MailClient, body: String): Any = client.sendSignatureRequest(body)

  fun internalRequest(api: SignatureRequestApi, body: String): Any = api.signatureRequestSend(body)
}
