// lexcode-expect: 0
using System.Net.Http;
using System.Net.Security;
using System.Security.Cryptography;
using System.Text;
using Jose;
using NSec.Cryptography;
using Org.BouncyCastle.Crypto.Digests;

namespace MyShop.Services;

// The platform's hashing, key derivation and TLS, a JWS (signed, not encrypted), a signature and a hash
// from a bundled library, and the app's own classes named like library ones. (.NET's own ciphers are
// shipping encryption too; cs-platform-encryption reads them, and cs-library-encryption.test.platform.cs
// pins that this rule leaves .NET's ChaCha20Poly1305 to it.)
public class TokenService(HttpClient http)
{
    public async Task<string> RunAsync(byte[] key, byte[] data, string payload)
    {
        var digest = SHA256.HashData(data);
        using var kdf = new Rfc2898DeriveBytes("password", 16, 600_000, HashAlgorithmName.SHA256);

        var tls = new SslStream(Stream.Null);
        var page = await http.GetStringAsync("https://example.com/");

        var jws = JWT.Encode(payload, key, JwsAlgorithm.HS256);
        var ed = SignatureAlgorithm.Ed25519;
        var sha = new Sha256Digest();

        var mine = new GcmBlockCipher("not a cipher");
        var box = SecretBox.Create(Encoding.UTF8.GetBytes(payload));
        return jws + page + mine + box;
    }
}

public class GcmBlockCipher(string name)
{
    public override string ToString() => name;
}

public static class SecretBox
{
    public static string Create(byte[] data) => Convert.ToBase64String(data);
}
