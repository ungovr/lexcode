// lexcode-expect: 5
using Microsoft.AspNetCore.DataProtection;
using Dp = Microsoft.AspNetCore.DataProtection;

namespace MyShop.Security;

// Injected through a primary-constructor parameter
public class TokenProtector(IDataProtectionProvider provider)
{
    private readonly IDataProtector _protector = provider.CreateProtector("MyShop.Tokens.v1"); // 1

    public string Protect(string value) => _protector.Protect(value);

    public IDataProtector ForTenant(string tenant) => _protector.CreateProtector(tenant);    // 2
}

// Injected through a constructor parameter, named through an alias
public class LegacyProtector
{
    private readonly Dp.IDataProtectionProvider _provider;

    public LegacyProtector(Dp.IDataProtectionProvider provider)
    {
        _provider = provider;
    }

    public string Seal(string value)
    {
        var protector = _provider.CreateProtector("MyShop.Legacy");                              // 3
        return protector.Protect(value);
    }

    public static IDataProtectionProvider Standalone() =>
        DataProtectionProvider.Create("MyShop");                                                  // 4

    public static IDataProtectionProvider StandaloneAt(DirectoryInfo keys) =>
        Dp.DataProtectionProvider.Create(keys);                                                   // 5
}
