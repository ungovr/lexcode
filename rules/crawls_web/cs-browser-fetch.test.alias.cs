// lexcode-expect: 3
using Pw = Microsoft.Playwright;
using Sel = OpenQA.Selenium;
using Pup = PuppeteerSharp;

namespace PriceWatch.Scraping;

// The same browsers reached through aliases, with the browser objects injected.
public class AliasedPages(Pw.IPage page, Sel.IWebDriver webDriver, Pup.IPage tab)
{
    public async Task OpenAsync(string listingUrl)
    {
        await page.GotoAsync(listingUrl);
        webDriver.Navigate().GoToUrl(listingUrl);
        await tab.GoToAsync(listingUrl);
    }
}
