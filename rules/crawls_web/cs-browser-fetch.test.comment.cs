// lexcode-expect: 2
/* Price checker.
   Drives a real browser. */
using Microsoft.Playwright; // the browser library

namespace PriceWatch.Scraping;

// A `using` with a comment after it, and PuppeteerSharp named in full on a code line after a string
// that holds `//`, with block comments before and after: both count.
public class CommentedBrowser(IPage page)
{
    public async Task OpenAsync(string listingUrl)
    {
        await page.GotoAsync(listingUrl);
        var home = "https://deals.example.com/"; var options = new PuppeteerSharp.LaunchOptions { Headless = true };
        /* One page at a time. */
        await using var browser = await PuppeteerSharp.Puppeteer.LaunchAsync(options);
        var tab = await browser.NewPageAsync();
        await tab.GoToAsync(home);
    }
}
