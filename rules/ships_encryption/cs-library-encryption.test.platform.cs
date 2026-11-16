// lexcode-expect: 1
using System.Security.Cryptography;

namespace MyShop.Security;

// .NET's ChaCha20Poly1305 shares its short name with Bouncy Castle's. Under `using
// System.Security.Cryptography;` it is .NET's, which cs-platform-encryption reads, so this rule counts
// only the Bouncy Castle cipher written fully qualified.
public class TwoCiphers
{
    public void Build(byte[] key)
    {
        using var platform = new ChaCha20Poly1305(key);
        ChaCha20Poly1305 platformToo = new(key);
        var bundled = new Org.BouncyCastle.Crypto.Modes.ChaCha20Poly1305(); // 1
    }
}
