using Microsoft.Playwright;
// lexcode-expect: 1

namespace PriceWatch.Scraping;

// A file saved with a UTF-8 byte order mark, as Visual Studio saves one, whose first line is the
// browser library's using.
public class BomPages(IPage page)
{
    public async Task OpenAsync(string productUrl)
    {
        await page.GotoAsync(productUrl);
    }
}
