// lexcode-expect: 0
using System.Net.Http;
using System.Net.Security;
using System.Security.Cryptography;
using System.Text;
using Jose;
using NSec.Cryptography;
using Org.BouncyCastle.Crypto.Digests;

namespace MyShop.Services;

// The platform's own cryptography and TLS (System.Security.Cryptography's ChaCha20Poly1305 shares its
// short name with Bouncy Castle's), a JWS (signed, not encrypted), a signature and a hash from a bundled
// library, and the app's own classes named like library ones.
public class TokenService(HttpClient http)
{
    public async Task<string> RunAsync(byte[] key, byte[] data, string payload)
    {
        using var aes = Aes.Create();
        aes.Key = key;
        var encrypted = aes.EncryptCbc(data, aes.IV);

        using var gcm = new AesGcm(key, 16);
        using var chacha = new ChaCha20Poly1305(key);
        ChaCha20Poly1305 chachaToo = new(key);
        using var ecdh = ECDiffieHellman.Create();
        using var rsa = RSA.Create();
        var wrapped = rsa.Encrypt(key, RSAEncryptionPadding.OaepSHA256);
        var stored = ProtectedData.Protect(data, null, DataProtectionScope.CurrentUser);
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
