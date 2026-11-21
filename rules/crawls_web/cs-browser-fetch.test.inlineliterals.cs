// lexcode-expect: 3
namespace PriceWatch.Scraping;

// A browser named in full on a code line after a verbatim string that ends in a backslash, and
// after a char literal that holds a double quote, and after a raw string that holds one: no
// literal hides the name.
public class InlineLiterals
{
    public async Task OpenAsync(string listingUrl)
    {
        var root = @"C:\shots\"; var options = new PuppeteerSharp.LaunchOptions { Headless = true };
        await using var browser = await Launcher.LaunchAsync(options);
        var tab = await browser.NewPageAsync();
        await tab.GoToAsync(listingUrl);
        var quote = '"'; var driver = new OpenQA.Selenium.Chrome.ChromeDriver();
        driver.Navigate().GoToUrl(listingUrl);
        var note = """a "b"""; using var pw = await Microsoft.Playwright.Playwright.CreateAsync();
        var page = await (await pw.Chromium.LaunchAsync()).NewPageAsync();
        await page.GotoAsync(listingUrl);
    }
}
