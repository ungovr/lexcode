// lexcode-expect: 0
using Microsoft.Playwright;

namespace Shop.Reports;

// The app's own pages, written as raw string literals: its dev server, a blank page, and an
// address built on the app's own URL.
public class RawInvoicePdfRenderer(IPage page)
{
    private readonly string appUrl = "https://shop.example.com";

    public async Task<byte[]> RenderAsync(int orderId)
    {
        await page.GotoAsync("""http://localhost:5000/invoices/preview""");
        await page.GotoAsync("""about:blank""");
        await page.GotoAsync($"""{appUrl}/invoices/{orderId}""");
        await page.GotoAsync($$"""{{appUrl}}/invoices/{{orderId}}""");
        await page.GotoAsync("""
            http://127.0.0.1:5000/invoices/preview
            """);

        return await page.PdfAsync();
    }
}
