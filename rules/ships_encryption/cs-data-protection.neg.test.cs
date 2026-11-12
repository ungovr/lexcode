// lexcode-expect: 0
namespace MyShop.Infrastructure;

// Turning on the framework's key ring (for its own cookies and antiforgery tokens) is not the app
// encrypting anything, and the app's own types of the framework's names (a provider, a protector and a
// standalone factory, in this namespace, with no `using Microsoft.AspNetCore.DataProtection;`) are not
// the framework's.
public static class DataProtectionSetup
{
    public static void Configure(IServiceCollection services)
    {
        services.AddDataProtection();
    }
}

public interface IDataProtectionProvider
{
    IDataProtector CreateProtector(string purpose);
}

public interface IDataProtector
{
    IDataProtector CreateProtector(string purpose);
    string Protect(string value);
}

public class DataProtectionProvider
{
    public static DataProtectionProvider Create(string name) => new();
}

public class Sealer(IDataProtectionProvider provider)
{
    public IDataProtector Make() => provider.CreateProtector("settings");
}

public class Nest(IDataProtector protector)
{
    public IDataProtector Make() => protector.CreateProtector("nested");

    public DataProtectionProvider Standalone() => DataProtectionProvider.Create("x");
}
