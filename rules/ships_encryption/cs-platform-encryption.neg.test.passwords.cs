// lexcode-expect: 0
// Password hashing is not shipping encryption, from the framework or a bundled library: ASP.NET Core
// Identity's hasher and KeyDerivation.Pbkdf2, BCrypt.Net and the Konscious and Isopoh Argon2 types.
using System.Text;
using Isopoh.Cryptography.Argon2;
using Konscious.Security.Cryptography;
using Microsoft.AspNetCore.Cryptography.KeyDerivation;
using Microsoft.AspNetCore.Identity;
using Kdf = Microsoft.AspNetCore.Cryptography.KeyDerivation;
using Ks = Konscious.Security.Cryptography;
using Bc = BCrypt.Net.BCrypt;

namespace MyShop.Accounts;

// The framework's hasher, injected through a primary-constructor parameter
public class AccountService(IPasswordHasher<Account> hasher)
{
    public string Hash(Account account, string password) =>
        hasher.HashPassword(account, password);

    public string HashLocal(Account account, string password)
    {
        var local = new PasswordHasher<Account>();
        PasswordHasher<Account> other = new();
        return local.HashPassword(account, password) + other;
    }
}

public class Account;

public static class LegacyHashes
{
    public static string Bcrypt(string password) =>
        BCrypt.Net.BCrypt.HashPassword(password, workFactor: 12);

    public static string BcryptAlias(string password) =>
        Bc.EnhancedHashPassword(password);

    public static byte[] Argon(string password, byte[] salt)
    {
        var argon = new Argon2id(Encoding.UTF8.GetBytes(password)) { Salt = salt };
        var argon2 = new Ks.Argon2i(Encoding.UTF8.GetBytes(password));
        return argon.GetBytes(32);
    }

    public static string Isopoh(string password) => Argon2.Hash(password);

    public static byte[] Pbkdf2(string password, byte[] salt) =>
        Kdf.KeyDerivation.Pbkdf2(password, salt, KeyDerivationPrf.HMACSHA256, 100_000, 32);
}
