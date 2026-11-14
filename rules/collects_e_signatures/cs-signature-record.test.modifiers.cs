// lexcode-expect: 8
namespace MyShop.Leases;

// A signature member under every access modifier, with and without an initializer, and with more
// modifiers; a local variable of the same name is not a member.
public class StorageLeaseAgreement
{
    protected string TenantSignature;                                                    // 1
    protected string GuardianSignature = "";                                             // 2
    internal string WitnessSignature;                                                    // 3
    internal string CustomerSignature = "";                                              // 4
    private string ClientSignature;                                                      // 5
    private string BuyerSignature = "";                                                  // 6
    public required string SignerSignature { get; init; }                                // 7
    public virtual string Signature { get; set; } = "";                                  // 8

    public string Local()
    {
        string signature = "x";
        return signature;
    }
}
