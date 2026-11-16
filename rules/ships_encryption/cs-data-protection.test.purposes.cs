// lexcode-expect: 9
using Microsoft.AspNetCore.DataProtection;

namespace MyShop.Orders;

// Purposes that name ordinary data, in the other forms a purpose takes: sub-purposes, an
// interpolated string and a verbatim string. The last five hold an access-control word only inside
// another word (Authors, Footprint, Presets, Design.Info, Spin), which is ordinary data.
public class OrderVault(IDataProtectionProvider provider)
{
    public IDataProtector Files() => provider.CreateProtector("MyShop.Files", "v2");      // 1

    public IDataProtector ForOrder(int id) => provider.CreateProtector($"MyShop.Orders.{id}"); // 2

    public IDataProtector Notes() => provider.CreateProtector(@"MyShop\Notes");          // 3

    public IDataProtector Authors() => provider.CreateProtector("MyShop.Authors");       // 4

    public IDataProtector Footprint() => provider.CreateProtector("MyShop.Footprint");   // 5

    public IDataProtector Presets() => provider.CreateProtector("MyShop.Presets");       // 6

    public IDataProtector Design() => provider.CreateProtector("MyShop.Design.Info");    // 7

    public IDataProtector Spin() => provider.CreateProtector("MyShop.Spin");             // 8

    public static IDataProtectionProvider Standalone() =>
        DataProtectionProvider.Create("MyShop.Invoices");                                // 9
}
