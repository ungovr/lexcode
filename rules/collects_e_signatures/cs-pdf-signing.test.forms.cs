// lexcode-expect: 2
using Syncfusion.Pdf.Security;

namespace MyShop.Contracts;

// Syncfusion's signature in its target-typed form, with and without an object initializer.
public class ContractSealerForms
{
    public void Seal(object page, PdfCertificate certificate)
    {
        PdfSignature tenant = new(page, certificate, "Tenant");                           // 1
        PdfSignature landlord = new(page, certificate, "Landlord") { Reason = "Lease" };  // 2
    }
}
