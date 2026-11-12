// lexcode-expect: 1
namespace MyShop.Kyc;

// A vendor address in a fully qualified System.Uri.
public class OnfidoBase
{
    public System.Uri Address { get; } = new System.Uri("https://api.onfido.com/v3.6/applicants"); // 1
}
