// lexcode-expect: 9
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
        hasher.HashPassword(account, password);                                         // 1

    public string HashLocal(Account account, string password)
    {
        var local = new PasswordHasher<Account>();                                      // 2
        PasswordHasher<Account> other = new();                                          // 3 target-typed new()
        return local.HashPassword(account, password) + other;
    }
}

public class Account;

public static class LegacyHashes
{
    public static string Bcrypt(string password) =>
        BCrypt.Net.BCrypt.HashPassword(password, workFactor: 12);                       // 4 fully qualified

    public static string BcryptAlias(string password) =>
        Bc.EnhancedHashPassword(password);                                              // 5 type alias

    public static byte[] Argon(string password, byte[] salt)
    {
        var argon = new Argon2id(Encoding.UTF8.GetBytes(password)) { Salt = salt };     // 6 using
        var argon2 = new Ks.Argon2i(Encoding.UTF8.GetBytes(password));                  // 7 alias
        return argon.GetBytes(32);
    }

    public static string Isopoh(string password) => Argon2.Hash(password);              // 8

    public static byte[] Pbkdf2(string password, byte[] salt) =>
        Kdf.KeyDerivation.Pbkdf2(password, salt, KeyDerivationPrf.HMACSHA256, 100_000, 32); // 9
}
