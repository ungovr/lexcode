// lexcode-expect: 6
using Microsoft.Playwright;
using OpenQA.Selenium;
using OpenQA.Selenium.Chrome;
using PuppeteerSharp;

namespace PriceWatch.Scraping;

// A price tracker that opens competitors' product pages in a headless browser.
public class CompetitorPages(IPage injectedPage)
{
    // Playwright, on a page it opens itself and on an injected one.
    public async Task<string> PlaywrightAsync(string productUrl)
    {
        using var playwright = await Playwright.CreateAsync();
        await using var browser = await playwright.Chromium.LaunchAsync(new() { Headless = true });
        var page = await browser.NewPageAsync();
        await page.GotoAsync(productUrl);
        await injectedPage.GotoAsync("https://shop.example.com/deals", new() { WaitUntil = WaitUntilState.NetworkIdle });

        return await page.InnerTextAsync(".price");
    }

    // Selenium WebDriver, by navigation and by setting the address.
    public string Selenium(string productUrl)
    {
        var driver = new ChromeDriver();
        driver.Navigate().GoToUrl(productUrl);
        driver.Url = "https://store.example.net/catalog?page=2";
        ChromeDriver headlessDriver = new();
        headlessDriver.Navigate().GoToUrl(new Uri(productUrl));

        return driver.FindElement(By.CssSelector(".price")).Text;
    }

    // PuppeteerSharp.
    public async Task<string> PuppeteerAsync(string productUrl)
    {
        await using var browser = await Puppeteer.LaunchAsync(new LaunchOptions { Headless = true });
        await using var tab = await browser.NewPageAsync();
        await tab.GoToAsync(productUrl);

        return await tab.GetContentAsync();
    }
}
