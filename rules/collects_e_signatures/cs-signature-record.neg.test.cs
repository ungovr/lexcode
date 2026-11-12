// lexcode-expect: 0
using System.Security.Cryptography;
using System.Text;

namespace MyShop.Integrations;

// A webhook's signature, a forum or email signature on a profile, a key's signature algorithm, and an
// agreement accepted with a checkbox: none is a person signing a document.
public class CreateWebhookSignatureRequest
{
    public string Signature { get; set; } = "";
    public string TransmissionId { get; set; } = "";
}

public class ContractorProfile
{
    public string Signature { get; set; } = "";
}

public class ForumAccountInfoModel
{
    public string Signature { get; set; } = "";
}

public class UserAgreement
{
    public bool AcceptedTerms { get; set; }
    public DateTime AcceptedAt { get; set; }
}

public class LeaseAgreementService
{
    public string Verify(string payload, byte[] key)
    {
        var signature = Convert.ToHexString(HMACSHA256.HashData(key, Encoding.UTF8.GetBytes(payload)));
        return signature;
    }
}

public record TokenSigningOptions(string SignatureAlgorithm, string KeyId);
