// lexcode-expect: 24
using System.Text;
using Jose;
using Microsoft.IdentityModel.Tokens;
using NSec.Cryptography;
using Org.BouncyCastle.Bcpg.OpenPgp;
using Org.BouncyCastle.Crypto.Agreement;
using Org.BouncyCastle.Crypto.Engines;
using Org.BouncyCastle.Crypto.Modes;
using Org.BouncyCastle.Crypto.Paddings;
using Org.BouncyCastle.Security;
using PgpCore;
using Sodium;
using Bc = Org.BouncyCastle.Crypto.Modes;
using Na = NSec.Cryptography;
using Pgp = PgpCore.PGP;
using Esdk = AWS.Cryptography.EncryptionSDK;
using Signal = libsignal;

namespace MyShop.Vault;

public class Vault
{
    public string Seal(byte[] key, byte[] nonce, byte[] data, string payload, EncryptionKeys keys)
    {
        var gcm = new GcmBlockCipher(new AesEngine());                              // 1 using
        var ccm = new Bc.CcmBlockCipher(new AesEngine());                           // 2 alias
        ChaCha20Poly1305 chacha = new();                                            // 3 target-typed new()
        var padded = new PaddedBufferedBlockCipher(new CbcBlockCipher(new AesEngine())); // 4
        var agreement = new X25519Agreement();                                      // 5
        var pgpGen = new PgpEncryptedDataGenerator(SymmetricKeyAlgorithmTag.Aes256); // 6
        var cipher = CipherUtilities.GetCipher("AES/GCM/NoPadding");                // 7

        var aead = AeadAlgorithm.ChaCha20Poly1305;                                  // 8 using
        var x25519 = Na.KeyAgreementAlgorithm.X25519;                               // 9 alias

        var box = SecretBox.Create(data, nonce, key);                               // 10
        var sealedBox = SealedPublicKeyBox.Create(data, key);                       // 11
        var xchacha = SecretAeadXChaCha20Poly1305.Encrypt(data, nonce, key);        // 12

        var pgp = new PGP(keys);                                                    // 13 using
        var pgp2 = new Pgp(keys);                                                   // 14 type alias
        PGP pgp3 = new(keys);                                                       // 15 target-typed new()

        var jwe = JWT.Encode(payload, key, JweAlgorithm.A256KW, JweEncryption.A256GCM); // 16
        var creds = new EncryptingCredentials(new SymmetricSecurityKey(key), "dir", "A256GCM"); // 17

        var session = new Signal.SessionCipher(store, address);                     // 18 namespace alias

        var sdk = AwsEncryptionSdkFactory.CreateDefaultAwsEncryptionSdk();          // 19 a global using in another file
        var sdk4 = new Esdk.ESDK(config);                                           // 20 alias
        var full = new Org.BouncyCastle.Crypto.Modes.EaxBlockCipher(new AesEngine()); // 21 fully qualified
        var fullBox = Sodium.PublicKeyBox.Create(data, nonce, key, key);            // 22 fully qualified
        var withInit = new EncryptingCredentials(new SymmetricSecurityKey(key), "dir", "A256GCM") { KeyExchangePublicKey = null }; // 23 object initializer
        PgpEncryptedDataGenerator gen2 = new(SymmetricKeyAlgorithmTag.Aes256) { };  // 24 target-typed new() with an initializer
        return Encoding.UTF8.GetString(box) + jwe;
    }
}
