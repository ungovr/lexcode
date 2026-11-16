// lexcode-expect: 0
using Konscious.Security.Cryptography;

namespace MyShop.Accounts;

// Konscious's Argon2 variants, target-typed and with an initializer: password hashing, not encryption.
public static class ArgonForms
{
    public static void Run(byte[] password)
    {
        Argon2id id = new(password);
        Argon2i i = new(password) { Iterations = 4 };
        var d = new Argon2d(password);
        Argon2d d2 = new(password);
    }
}
