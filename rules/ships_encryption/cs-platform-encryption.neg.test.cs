// lexcode-expect: 0
using System.Net.Http;
using System.Security.Cryptography;
using System.Text;

namespace MyShop.Accounts;

// .NET cryptography that encrypts nothing and agrees no key: hashing, an HMAC, key derivation, RSA and
// ECDSA signatures, random bytes and a generated key, then HTTPS through HttpClient.
public class Integrity(HttpClient http)
{
    public async Task<string> RunAsync(byte[] key, byte[] data, string password, byte[] salt)
    {
        var digest = SHA256.HashData(data);
        using var hmac = new HMACSHA256(key);
        var tag = hmac.ComputeHash(data);
        var derived = Rfc2898DeriveBytes.Pbkdf2(password, salt, 600_000, HashAlgorithmName.SHA256, 32);
        using var kdf = new Rfc2898DeriveBytes(password, 16, 600_000, HashAlgorithmName.SHA256);

        using var rsa = RSA.Create();
        var signature = rsa.SignData(data, HashAlgorithmName.SHA256, RSASignaturePadding.Pss);
        var ok = rsa.VerifyData(data, signature, HashAlgorithmName.SHA256, RSASignaturePadding.Pss);
        using var ecdsa = ECDsa.Create();
        var ecSignature = ecdsa.SignData(data, HashAlgorithmName.SHA256);

        var nonce = RandomNumberGenerator.GetBytes(16);
        using var aes = Aes.Create();
        aes.GenerateKey();

        var page = await http.GetStringAsync("https://api.example.org/v1/items");
        return Convert.ToHexString(digest) + tag.Length + derived.Length + ok + ecSignature.Length + nonce.Length + page;
    }
}
