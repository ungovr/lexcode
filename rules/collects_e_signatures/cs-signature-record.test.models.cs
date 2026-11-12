// lexcode-expect: 8
namespace MyShop.Leases;

// A person's signature, or an image of one, on the request, page and view models an app builds around
// an agreement: the agreement word sits inside the type name, not at its end.
public class SignWaiverRequest
{
    public string SignatureImage { get; set; } = "";                                     // 1
}

public class CreateLeaseAgreementRequest
{
    public string TenantSignature { get; set; } = "";                                    // 2
}

public class AcceptContractRequest
{
    public string CustomerSignature { get; set; } = "";                                  // 3
}

public class SubmitConsentRequest
{
    public string SignatureBase64 { get; set; } = "";                                    // 4
}

public class WaiverSigningViewModel
{
    public string SignatureImage { get; set; } = "";                                     // 5
}

public class LeaseAgreementSummary
{
    public string TenantSignature { get; set; } = "";                                    // 6
}

public class ContractSignatureDto
{
    public string SignatureImage { get; set; } = "";                                     // 7
}

public class WorkOrderLine
{
    public string CustomerSignature { get; set; } = "";                                  // 8
}
