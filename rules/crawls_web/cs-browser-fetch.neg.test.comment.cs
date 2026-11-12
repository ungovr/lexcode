// lexcode-expect: 0
//using OpenQA.Selenium;
using Shop.Testing.Fakes;

namespace Shop.Testing;

// The app's own page and driver types. The browser libraries are only mentioned: add using
// Microsoft.Playwright when the end-to-end suite moves here, the commented-out line above, and a
// block comment.
/* using PuppeteerSharp;
 * see Microsoft.Playwright.IPage for the shape we copied
 */
public class CheckoutFlow(IPage page, IWebDriver driver)
{
    public async Task RunAsync(string nextStepUrl)
    {
        await page.GotoAsync(nextStepUrl);
        await page.GoToAsync(nextStepUrl);
        driver.Navigate().GoToUrl(nextStepUrl);
        driver.Url = nextStepUrl;
    }
}
