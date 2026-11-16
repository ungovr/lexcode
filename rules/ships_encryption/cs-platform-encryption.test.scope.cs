// lexcode-expect: 7
using System.Text;
using Sc = System.Security.Cryptography;

namespace MyShop.Legacy;

// A symmetric algorithm's encryptor where the namespace is in scope another way: through an alias,
// and with the algorithm built fully qualified (declared with var, using var, a type, a using block
// and a chain), and the legacy RSACryptoServiceProvider with its bool OAEP flag.
public class Scopes
{
    public byte[] Aliased(byte[] key, byte[] plain)
    {
        using var aes = Sc.Aes.Create();
        aes.Key = key;
        return aes.EncryptCbc(plain, aes.IV);                                              // 1
    }

    public void Qualified(byte[] key, byte[] iv)
    {
        using var aes = System.Security.Cryptography.Aes.Create();
        using var encryptor = aes.CreateEncryptor(key, iv);                                // 2
    }

    public void Typed(byte[] key, byte[] iv)
    {
        System.Security.Cryptography.SymmetricAlgorithm des = System.Security.Cryptography.TripleDES.Create();
        var decryptor = des.CreateDecryptor(key, iv);                                      // 3
    }

    public void Block(byte[] key, byte[] iv)
    {
        using (var aes = System.Security.Cryptography.Aes.Create())
        {
            var encryptor = aes.CreateEncryptor(key, iv);                                  // 4
        }
    }

    public object Chain(byte[] key, byte[] iv) =>
        System.Security.Cryptography.Aes.Create().CreateEncryptor(key, iv);                // 5

    public byte[] LegacyRsa(byte[] data)
    {
        var rsa = new System.Security.Cryptography.RSACryptoServiceProvider(2048);
        var sealedBytes = rsa.Encrypt(data, true);                                         // 6
        return rsa.Decrypt(sealedBytes, true);                                             // 7
    }
}
