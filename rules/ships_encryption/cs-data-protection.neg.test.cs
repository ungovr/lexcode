// lexcode-expect: 0
namespace MyShop.Infrastructure;

// Turning on the framework's key ring (for its own cookies and antiforgery tokens) is not the app
// encrypting anything, and the app's own provider type of the same name is not the framework's.
public static class DataProtectionSetup
{
    public static void Configure(IServiceCollection services)
    {
        services.AddDataProtection();
    }
}

public interface ISettingsProtectionProvider
{
    string CreateProtector(string purpose);
}

public class DataProtectionProvider
{
    public static DataProtectionProvider Create(string name) => new();
}

public class SettingsReader(ISettingsProtectionProvider settings)
{
    public string Read() => settings.CreateProtector("settings") + DataProtectionProvider.Create("x");
}
