// lexcode-expect: 0
// Sending, signing and checking things that are not a person's electronic signature on a
// document: an email message, a cryptographic signature over bytes, a JWT, a PDF built without a
// signature, and a project class named EnvelopesApi that is not DocuSign's.
package demo.docs;

import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import demo.mail.EnvelopesApi;
import io.jsonwebtoken.Jwts;
import java.security.PrivateKey;
import java.security.Signature;
import javax.mail.Message;
import javax.mail.Transport;

public class Documents {
  public void mail(Message message) throws Exception {
    Transport.send(message);
  }

  public byte[] sign(PrivateKey key, byte[] data) throws Exception {
    Signature signature = Signature.getInstance("SHA256withRSA");
    signature.initSign(key);
    signature.update(data);
    return signature.sign();
  }

  public String token(javax.crypto.SecretKey key) {
    return Jwts.builder().subject("someone").signWith(key).compact();
  }

  public PdfDocument plainPdf(String path) throws Exception {
    return new PdfDocument(new PdfWriter(path));
  }

  public Object internalEnvelope(EnvelopesApi api, String body) {
    return api.createEnvelope("account", body);
  }
}
