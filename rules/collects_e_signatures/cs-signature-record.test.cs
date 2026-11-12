// lexcode-expect: 5
using System.ComponentModel.DataAnnotations;

namespace MyShop.Leases;

public class LeaseAgreement
{
    public int Id { get; set; }
    public string TenantSignature { get; set; } = "";                                    // 1
    public DateTime SignedAt { get; set; }
}

public class EventWaiver
{
    [Required]
    public byte[] SignatureImage { get; set; }                                           // 2
    private string _witness = "";
}

public class PhotoReleaseConsent
{
    public string signature_base64;                                                      // 3
}

public record ParentalConsentForm(string ChildName, string GuardianSignature);           // 4

public record WorkOrderSignOff(int OrderId, string CustomerSignature)                    // 5
{
    public bool Complete => CustomerSignature.Length > 0;
}
