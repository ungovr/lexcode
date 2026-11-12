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

// A key's signature on a model whose name holds an agreement word: an exchange order, a contract ABI,
// a device enrollment, WebAuthn and software attestations, a lock and webhook payloads.
public class ContractOrderRequest
{
    public string Symbol { get; set; } = "";
    public string Signature { get; set; } = "";
    public string SignatureData { get; set; } = "";
    public string ClientSignature { get; set; } = "";
}

public class ContractMethodInfo
{
    public string Signature { get; set; } = "";
}

public class DeviceEnrollmentRequest
{
    public string Signature { get; set; } = "";
}

public class AttestationResponse
{
    public byte[] Signature { get; set; } = [];
    public byte[] SignatureData { get; set; } = [];
}

public record WebAuthnAttestation(byte[] AuthData, byte[] Signature);

public class SoftwareReleaseAttestation
{
    public string Signature { get; set; } = "";
}

public class LeaseLockInfo
{
    public string Signature { get; set; } = "";
}

public class AgreementWebhookEvent
{
    public string Signature { get; set; } = "";
    public string SignatureFile { get; set; } = "";
}

public class ConsentWebhookPayload
{
    public string Signature { get; set; } = "";
}

public class ConsentCallbackToken
{
    public string Signature { get; set; } = "";
}
