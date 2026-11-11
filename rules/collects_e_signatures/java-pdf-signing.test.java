// lexcode-expect: 4
// Applying a digital signature to a document: PDFBox's addSignature, iText 7's PdfSigner and
// iText 5's PdfStamper.createSignature, and the European Commission's DSS PAdES service.
package demo.pdf;

import com.itextpdf.kernel.pdf.PdfReader;
import com.itextpdf.signatures.PdfSigner;
import com.itextpdf.text.pdf.PdfStamper;
import eu.europa.esig.dss.pades.signature.PAdESService;
import java.io.OutputStream;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.interactive.digitalsignature.PDSignature;
import org.apache.pdfbox.pdmodel.interactive.digitalsignature.SignatureInterface;

public class PdfSigning {
  public void pdfbox(PDDocument document, SignatureInterface signer) throws Exception {
    PDSignature signature = new PDSignature();
    signature.setName("Signer");
    document.addSignature(signature, signer);
  }

  public PdfSigner itext7(PdfReader reader, OutputStream out) throws Exception {
    return new PdfSigner(reader, out, new com.itextpdf.kernel.pdf.StampingProperties());
  }

  public PdfStamper itext5(com.itextpdf.text.pdf.PdfReader reader, OutputStream out) throws Exception {
    return PdfStamper.createSignature(reader, out, '\0');
  }

  public PAdESService dss(eu.europa.esig.dss.spi.x509.CertificateSource verifier) {
    return new PAdESService(null);
  }
}
