// lexcode-expect: 3
using Microsoft.AspNetCore.DataProtection;

namespace MyShop.Orders;

// Purposes that name ordinary data, in the other forms a purpose takes: sub-purposes, an
// interpolated string and a verbatim string.
public class OrderVault(IDataProtectionProvider provider)
{
    public IDataProtector Files() => provider.CreateProtector("MyShop.Files", "v2");      // 1

    public IDataProtector ForOrder(int id) => provider.CreateProtector($"MyShop.Orders.{id}"); // 2

    public IDataProtector Notes() => provider.CreateProtector(@"MyShop\Notes");          // 3
}
