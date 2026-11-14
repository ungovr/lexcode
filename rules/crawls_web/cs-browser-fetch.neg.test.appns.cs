// lexcode-expect: 0
using Shop.Testing.Fakes;

namespace Shop.Testing;

// The app's own page and driver types in its own namespace, with the same short names and method
// names as Playwright's, Selenium's and PuppeteerSharp's. No browser library is named in this file,
// so none of these calls is taken for a browser opening another site's page.
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
