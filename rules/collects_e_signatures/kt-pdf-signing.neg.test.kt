// lexcode-expect: 0
// Working with PDFs and signatures that are not a digital signature on a document: PDFBox
// reading text and adding a page, iText merging PDFs, a footer type of the project with an
// addSignature method (an email signature line), and reading signatures already applied. The
// library guards are tested too: this file imports no PDFBox class (PDFBox's PDDocument is named
// in full where it is used) and calls addSignature on documents of the project's own PDDocument
// and Loader, and calls iText's and DSS's class names (PdfStamper, PdfSigner, PAdESService) on
// classes of the project's own.
package demo.pdf

import com.itextpdf.kernel.pdf.PdfDocument
import com.itextpdf.kernel.pdf.PdfReader
import com.itextpdf.kernel.pdf.PdfWriter
import com.itextpdf.kernel.utils.PdfMerger
import com.itextpdf.signatures.SignatureUtil
import demo.legacy.CAdESService
import demo.legacy.PAdESService
import demo.legacy.XAdESService
import demo.legacy.PdfSigner
import demo.legacy.PdfStamper
import demo.mail.Footer
import demo.pdf.Loader
import demo.pdf.PDDocument
import java.io.File

class PdfWork {
  fun text(file: File): String =
      org.apache.pdfbox.pdmodel.PDDocument.load(file).use { document ->
        org.apache.pdfbox.text.PDFTextStripper().getText(document)
      }

  fun addPage(document: org.apache.pdfbox.pdmodel.PDDocument) {
    document.addPage(org.apache.pdfbox.pdmodel.PDPage())
  }

  fun merge(first: String, second: String, out: String) {
    val target = PdfDocument(PdfWriter(out))
    val merger = PdfMerger(target)
    merger.merge(PdfDocument(PdfReader(first)), 1, 1)
    merger.merge(PdfDocument(PdfReader(second)), 1, 1)
    target.close()
  }

  fun existingSignatures(document: PdfDocument): List<String> = SignatureUtil(document).signatureNames

  fun footer(footer: Footer) {
    footer.addSignature("Regards, the team")
  }

  fun ownTyped(document: PDDocument) {
    document.addSignature("stamp")
  }

  fun ownLoaded(file: File) {
    val document = PDDocument.load(file)
    document.addSignature("stamp")
  }

  fun ownLoader(file: File) {
    val document = Loader.loadPDF(file)
    document.addSignature("stamp")
  }

  fun ownUse(file: File) {
    PDDocument.load(file).use { document ->
      document.addSignature("stamp")
    }
  }

  fun ownStamper(input: String, output: String): Any = PdfStamper.createSignature(input, output)

  fun ownSigner(input: String): Any = PdfSigner(input)

  fun ownPades(input: String): Any = PAdESService(input)

  fun ownXades(input: String): Any = XAdESService(input)

  fun ownCades(input: String): Any = CAdESService(input)
}
