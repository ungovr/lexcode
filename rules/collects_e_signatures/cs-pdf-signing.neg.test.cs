// lexcode-expect: 0
using iText.Kernel.Pdf;
using iText.Layout;
using iText.Layout.Element;

namespace MyShop.Reports;

// Writing a PDF, and checking the signatures a PDF already holds, sign nothing; the app's own
// signer class is not iText's.
public class InvoiceWriter
{
    public void Write(Stream output, string text)
    {
        using var pdf = new PdfDocument(new PdfWriter(output));
        using var document = new Document(pdf);
        document.Add(new Paragraph(text));
    }

    public IList<string> Signers(PdfDocument pdf)
    {
        var util = new iText.Signatures.SignatureUtil(pdf);
        return util.GetSignatureNames();
    }

    public string Stamp(string invoiceId) => new PdfSigner(invoiceId).ToString();
}

public class PdfSigner(string invoiceId)
{
    public override string ToString() => $"approved {invoiceId}";
}
