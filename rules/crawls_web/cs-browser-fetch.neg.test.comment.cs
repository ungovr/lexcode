// lexcode-expect: 0
//using OpenQA.Selenium;
using Shop.Testing.Fakes;

namespace Shop.Testing;

// The app's own page and driver types. The browser libraries are only mentioned: add using
// Microsoft.Playwright when the end-to-end suite moves here, the commented-out line above, block
// comments (lines that open with `*` and lines that do not), and comments after code on a line.
/* using PuppeteerSharp;
 * see Microsoft.Playwright.IPage for the shape we copied
 */
/*
using OpenQA.Selenium;
   driver = new OpenQA.Selenium.Chrome.ChromeDriver();
*/
public class CheckoutFlow(IPage page, IWebDriver driver)
{
    private readonly int _timeout = 30; // as Microsoft.Playwright.PageGotoOptions.Timeout did
    private readonly bool _headless = true; /* PuppeteerSharp.LaunchOptions default */

    public async Task RunAsync(string nextStepUrl)
    {
        await page.GotoAsync(nextStepUrl);
        await page.GoToAsync(nextStepUrl);
        driver.Navigate().GoToUrl(nextStepUrl);
        driver.Url = nextStepUrl;
    }
}
