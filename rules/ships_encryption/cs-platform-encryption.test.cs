// lexcode-expect: 20
using System.Security.Cryptography;
using Sc = System.Security.Cryptography;

namespace MyShop.Security;

// .NET's own cryptography used to keep data confidential: the AEAD types, a symmetric algorithm's
// encryptor and one-shot modes, RSA encryption, ECDH and DPAPI.
public class FieldCipher
{
    public byte[] SealGcm(byte[] key, byte[] nonce, byte[] plain, byte[] tag)
    {
        using var gcm = new AesGcm(key, 16);                                              // 1
        var cipher = new byte[plain.Length];
        gcm.Encrypt(nonce, plain, cipher, tag);
        return cipher;
    }

    public void OtherAeads(byte[] key)
    {
        using var ccm = new AesCcm(key);                                                   // 2
        using var chacha = new ChaCha20Poly1305(key);                                      // 3
        AesGcm targetTyped = new(key, 16);                                                 // 4 target-typed new()
        ChaCha20Poly1305 chachaToo = new(key);                                             // 5
        using var qualified = new System.Security.Cryptography.AesGcm(key, 16);            // 6 fully qualified
        using var aliased = new Sc.AesCcm(key);                                            // 7 alias
    }

    public byte[] SealCbc(byte[] key, byte[] plain)
    {
        using var aes = Aes.Create();
        aes.Key = key;
        using var encryptor = aes.CreateEncryptor();                                       // 8
        return encryptor.TransformFinalBlock(plain, 0, plain.Length);
    }

    public byte[] OpenCbc(byte[] key, byte[] iv, byte[] data)
    {
        using var aes = Aes.Create();
        using var decryptor = aes.CreateDecryptor(key, iv);                                // 9
        return decryptor.TransformFinalBlock(data, 0, data.Length);
    }

    public byte[] OneShot(byte[] key, byte[] iv, byte[] plain)
    {
        using var aes = Aes.Create();
        aes.Key = key;
        var cbc = aes.EncryptCbc(plain, iv);                                               // 10
        var ecb = aes.EncryptEcb(plain, PaddingMode.PKCS7);                                // 11
        var cfb = aes.EncryptCfb(plain, iv);                                               // 12
        return aes.DecryptCbc(cbc, iv);                                                    // 13
    }

    public byte[] Legacy(byte[] key, byte[] iv, byte[] plain)
    {
        using var des = TripleDES.Create();
        using var encryptor = des                                                         // 14
            .CreateEncryptor(key, iv);
        return encryptor.TransformFinalBlock(plain, 0, plain.Length);
    }

    public byte[] WrapKey(RSA rsa, byte[] dataKey) =>
        rsa.Encrypt(dataKey, RSAEncryptionPadding.OaepSHA256);                             // 15

    public byte[] UnwrapKey(RSA rsa, byte[] wrapped) =>
        rsa.Decrypt(wrapped, RSAEncryptionPadding.OaepSHA256);                             // 16

    public byte[] Agree(ECDiffieHellmanPublicKey peer)
    {
        using var ecdh = ECDiffieHellman.Create();                                         // 17
        return ecdh.DeriveKeyMaterial(peer);
    }

    public byte[] AgreeQualified() =>
        System.Security.Cryptography.ECDiffieHellman.Create(ECCurve.NamedCurves.nistP256).ExportSubjectPublicKeyInfo(); // 18

    public byte[] StoreForUser(byte[] secret) =>
        ProtectedData.Protect(secret, null, DataProtectionScope.CurrentUser);              // 19

    public byte[] ReadForUser(byte[] sealedBytes) =>
        ProtectedData.Unprotect(sealedBytes, null, DataProtectionScope.CurrentUser);       // 20
}
