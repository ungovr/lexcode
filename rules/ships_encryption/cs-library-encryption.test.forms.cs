// lexcode-expect: 27
using Org.BouncyCastle.Crypto;
using Org.BouncyCastle.Crypto.Agreement;
using Org.BouncyCastle.Crypto.Encodings;
using Org.BouncyCastle.Crypto.Modes;
using Org.BouncyCastle.Crypto.Paddings;
using Org.BouncyCastle.Cms;
using Sodium;
using Jose;
using Microsoft.IdentityModel.Tokens;
using libsignal;
using libsignal.groups;
using AWS.Cryptography.EncryptionSDK;

namespace MyShop.Vault;

// Every constructor in both forms (`new T(...)` and target-typed `T v = new(...)`), and the calls the
// main fixture does not make.
public class VaultForms
{
    public void Run(object engine, object mac, byte[] key, object store, object address, object config)
    {
        GcmBlockCipher gcm = new(engine);                                                 // 1
        CcmBlockCipher ccm = new(engine);                                                 // 2
        EaxBlockCipher eax = new(engine);                                                 // 3
        var ocb = new OcbBlockCipher(engine, engine);                                     // 4
        OcbBlockCipher ocb2 = new(engine, engine);                                        // 5
        var chacha = new ChaCha20Poly1305();                                              // 6
        PaddedBufferedBlockCipher padded = new(engine);                                   // 7
        var buffered = new BufferedBlockCipher(engine);                                   // 8
        BufferedBlockCipher buffered2 = new(engine);                                      // 9
        var oaep = new OaepEncoding(engine);                                              // 10
        OaepEncoding oaep2 = new(engine);                                                 // 11
        X25519Agreement x25519 = new();                                                   // 12
        var ecdh = new ECDHBasicAgreement();                                              // 13
        ECDHBasicAgreement ecdh2 = new();                                                 // 14
        var cms = new CmsEnvelopedDataGenerator();                                        // 15
        CmsEnvelopedDataGenerator cms2 = new();                                           // 16
        SecretAeadAes.Encrypt(key, key, key);                                             // 17
        SecretAeadChaCha20Poly1305.Encrypt(key, key, key);                                // 18
        JWE.Encrypt("payload", null, JweAlgorithm.RSA_OAEP, JweEncryption.A256GCM);      // 19
        EncryptingCredentials creds = new(null, "dir", "A256GCM");                        // 20
        var x509 = new X509EncryptingCredentials(null);                                   // 21
        X509EncryptingCredentials x509b = new(null);                                      // 22
        SessionCipher session = new(store, address);                                      // 23
        var group = new GroupCipher(store, "name");                                       // 24
        GroupCipher group2 = new(store, "name");                                          // 25
        AWS.EncryptionSDK.AwsEncryptionSdkFactory.CreateDefaultAwsEncryptionSdk();        // 26 fully qualified
        ESDK sdk = new(config);                                                           // 27
    }
}
