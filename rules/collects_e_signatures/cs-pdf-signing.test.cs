// lexcode-expect: 8
using iText.Kernel.Pdf;
using iText.Signatures;
using Syncfusion.Pdf.Security;
using PdfSharp.Pdf.Signatures;
using Its = iText.Signatures;
using Sf = Syncfusion.Pdf.Security;

namespace MyShop.Contracts;

public class ContractSealer
{
    public void SealWithIText(PdfReader reader, Stream output)
    {
        var signer = new PdfSigner(reader, output, new StampingProperties());             // 1 using
        Its.PdfSigner aliased = new(reader, output, new StampingProperties());            // 2 alias, target-typed new()
    }

    public void SealWithSyncfusion(object page, PdfCertificate certificate)
    {
        var signature = new PdfSignature(page, certificate, "Tenant");                    // 3 using
        var aliased = new Sf.PdfSignature(page, certificate, "Landlord");                 // 4 alias
        var witness = new PdfSignature(page, certificate, "Witness") { Reason = "Lease", ContactInfo = "office" }; // 8 object initializer
    }

    public void SealLegacy(iTextSharp.text.pdf.PdfReader reader, Stream output)
    {
        var stamper = iTextSharp.text.pdf.PdfStamper.CreateSignature(reader, output, '\0'); // 5 fully qualified
    }

    public void SealWithAspose(Aspose.Pdf.Facades.PdfFileSignature file, object page, object sig)
    {
        file.Sign(1, "Lease", "landlord@example.com", "Dublin", true, page, sig);        // 6 typed parameter
    }

    public void SealWithPdfSharp(object document, object signer, object options)
    {
        DigitalSignatureHandler.ForDocument(document, signer, options);                  // 7 using
    }
}
