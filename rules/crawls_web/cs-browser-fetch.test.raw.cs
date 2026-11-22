// lexcode-expect: 2
using Microsoft.Playwright;

namespace PriceWatch.Scraping;

// Another site's pages, written as raw string literals.
public class RawListingBrowser(IPage page)
{
    public async Task OpenAsync(int n)
    {
        await page.GotoAsync("""https://raw.example.com/deals""");
        await page.GotoAsync($"""https://raw.example.com/page/{n}""");
    }
}
