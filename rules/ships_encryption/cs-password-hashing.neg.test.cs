// lexcode-expect: 0
using System.Security.Cryptography;
using System.Text;

namespace MyShop.Accounts;

// The platform's own key derivation and hashing, a fingerprint that is not a password, and the
// app's own hasher types named like the framework's.
public class SaltedHasher
{
    public byte[] Derive(string password, byte[] salt) =>
        Rfc2898DeriveBytes.Pbkdf2(password, salt, 600_000, HashAlgorithmName.SHA256, 32);

    public string Fingerprint(string document) =>
        Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(document)));
}

public interface IPasswordHasher<T>
{
    string HashPassword(T user, string password);
}

public class PasswordHasher<T> : IPasswordHasher<T>
{
    public string HashPassword(T user, string password) => password.GetHashCode().ToString();
}

public class Signup(IPasswordHasher<string> hasher)
{
    public string Run(string name, string password)
    {
        var own = new PasswordHasher<string>();
        return hasher.HashPassword(name, password) + own.HashPassword(name, password);
    }
}
