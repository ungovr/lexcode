// lexcode-expect: 0
namespace MyShop.Legacy;

// The app's own types with .NET's names, in a namespace with no `using System.Security.Cryptography;`:
// an AEAD, a symmetric algorithm with an encryptor, an RSA wrapper whose Encrypt takes the app's own
// padding, a key-agreement factory and a data-protection helper.
public class AesGcm(byte[] key, int tagSize)
{
    public byte[] Key { get; } = key;
}

public class ChaCha20Poly1305(byte[] key);

public class Scrambler
{
    public Scrambler CreateEncryptor() => this;
    public byte[] EncryptCbc(byte[] data, byte[] iv) => data;
}

public static class RSAEncryptionPadding
{
    public static readonly string OaepSHA256 = "oaep";
}

public class Wrapper
{
    public byte[] Encrypt(byte[] data, string padding) => data;
}

public static class ECDiffieHellman
{
    public static object Create() => new();
}

public static class ProtectedData
{
    public static byte[] Protect(byte[] data, byte[]? entropy, int scope) => data;
}

public class Uses
{
    public void Run(byte[] key, Wrapper rsa)
    {
        var gcm = new AesGcm(key, 16);
        ChaCha20Poly1305 chacha = new(key);
        var s = new Scrambler();
        var e = s.CreateEncryptor();
        var cbc = s.EncryptCbc(key, key);
        var wrapped = rsa.Encrypt(key, RSAEncryptionPadding.OaepSHA256);
        var ecdh = ECDiffieHellman.Create();
        var stored = ProtectedData.Protect(key, null, 0);
    }
}
