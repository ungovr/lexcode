// lexcode-expect: 9
// Applying a digital signature to a document: PDFBox's addSignature (on a typed document, on one
// just loaded with PDDocument.load or Loader.loadPDF, and inside use), iText 7's PdfSigner and
// iText 5's PdfStamper.createSignature, and the European Commission's DSS PAdES service.
package demo.pdf

import com.itextpdf.kernel.pdf.PdfReader
import com.itextpdf.signatures.PdfSigner
import com.itextpdf.text.pdf.PdfStamper
import eu.europa.esig.dss.cades.signature.CAdESService
import eu.europa.esig.dss.pades.signature.PAdESService
import eu.europa.esig.dss.xades.signature.XAdESService
import java.io.File
import java.io.OutputStream
import org.apache.pdfbox.Loader
import org.apache.pdfbox.pdmodel.PDDocument
import org.apache.pdfbox.pdmodel.interactive.digitalsignature.PDSignature
import org.apache.pdfbox.pdmodel.interactive.digitalsignature.SignatureInterface

class PdfSigning {
  fun pdfbox(document: PDDocument, signer: SignatureInterface) {
    val signature = PDSignature()
    signature.name = "Signer"
    document.addSignature(signature, signer)
  }

  fun pdfboxLoaded(file: File, signer: SignatureInterface) {
    val document = PDDocument.load(file)
    document.addSignature(PDSignature(), signer)
  }

  fun pdfboxLoader(file: File, signer: SignatureInterface) {
    val document = Loader.loadPDF(file)
    document.addSignature(PDSignature(), signer)
  }

  fun pdfboxUse(file: File, signer: SignatureInterface) {
    PDDocument.load(file).use { document ->
      document.addSignature(PDSignature(), signer)
    }
  }

  fun itext7(reader: PdfReader, out: OutputStream): PdfSigner =
      PdfSigner(reader, out, com.itextpdf.kernel.pdf.StampingProperties())

  fun itext5(reader: com.itextpdf.text.pdf.PdfReader, out: OutputStream): PdfStamper =
      PdfStamper.createSignature(reader, out, '\u0000')

  fun dss(): PAdESService = PAdESService(null)

  fun dssXml(): XAdESService = XAdESService(null)

  fun dssCms(): CAdESService = CAdESService(null)
}
