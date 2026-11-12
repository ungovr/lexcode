// lexcode-expect: 4
using Konscious.Security.Cryptography;

namespace MyShop.Accounts;

// Konscious's Argon2 variants in the forms the main fixture does not use.
public static class ArgonForms
{
    public static void Run(byte[] password)
    {
        Argon2id id = new(password);                                                      // 1
        Argon2i i = new(password) { Iterations = 4 };                                     // 2
        var d = new Argon2d(password);                                                    // 3
        Argon2d d2 = new(password);                                                       // 4
    }
}
