// lexcode-expect: 0
// Working with PDFs and signatures that are not a digital signature on a document: PDFBox
// reading text and adding a page, iText merging PDFs, a footer type of the project
// with an addSignature method (an email signature line), and reading signatures already applied.
// The library guard is tested too: this file imports PDFBox's PDDocument and calls iText's and
// DSS's class names (PdfStamper, PdfSigner, PAdESService) on classes of the project's own.
package demo.pdf;

import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfReader;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.kernel.utils.PdfMerger;
import com.itextpdf.signatures.SignatureUtil;
import demo.legacy.PAdESService;
import demo.legacy.PdfSigner;
import demo.legacy.PdfStamper;
import demo.mail.Footer;
import java.io.File;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.text.PDFTextStripper;

public class PdfWork {
  public String text(File file) throws Exception {
    try (PDDocument document = PDDocument.load(file)) {
      return new PDFTextStripper().getText(document);
    }
  }

  public void addPage(PDDocument document) {
    document.addPage(new PDPage());
  }

  public void merge(String first, String second, String out) throws Exception {
    PdfDocument target = new PdfDocument(new PdfWriter(out));
    PdfMerger merger = new PdfMerger(target);
    merger.merge(new PdfDocument(new PdfReader(first)), 1, 1);
    merger.merge(new PdfDocument(new PdfReader(second)), 1, 1);
    target.close();
  }

  public java.util.List<String> existingSignatures(PdfDocument document) {
    return new SignatureUtil(document).getSignatureNames();
  }

  public void footer(Footer footer) {
    footer.addSignature("Regards, the team");
  }

  public Object ownStamper(String in, String out) {
    return PdfStamper.createSignature(in, out);
  }

  public Object ownSigner(String in) {
    return new PdfSigner(in);
  }

  public Object ownPades(String in) {
    return new PAdESService(in);
  }
}
