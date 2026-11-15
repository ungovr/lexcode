// lexcode-expect: 0
using Microsoft.Playwright;
using OpenQA.Selenium;
using OpenQA.Selenium.Chrome;

namespace Shop.Reports;

// The app drives a headless browser only over its own pages: it renders invoices to PDF from HTML
// it holds, opens its own dev server and its own routes, and starts from a blank page. Nothing here
// opens a page on a site the operator does not run.
public class InvoicePdfRenderer(IPage page)
{
    private readonly string appUrl = "https://shop.example.com";

    public async Task<byte[]> RenderAsync(string invoiceHtml, int orderId)
    {
        await page.SetContentAsync(invoiceHtml);
        await page.GotoAsync("http://localhost:5000/invoices/preview");
        await page.GotoAsync("http://127.0.0.1:5000/invoices/preview");
        await page.GotoAsync("/invoices/" + orderId);
        await page.GotoAsync($"/invoices/{orderId}");
        await page.GotoAsync($"{appUrl}/invoices/{orderId}");
        await page.GotoAsync("about:blank");
        await page.GotoAsync("file:///var/app/templates/invoice.html");
        await page.GotoAsync("data:text/html,<p>Invoice</p>");

        return await page.PdfAsync();
    }

    // Selenium on the app's own pages, for a smoke check run by the operator.
    public void SmokeCheck()
    {
        var driver = new ChromeDriver();
        driver.Navigate().GoToUrl("http://localhost:5000/health");
        driver.Url = "http://[::1]:5000/";
        driver.Navigate().GoToUrl($"{appUrl}/health");
        driver.Quit();
    }
}
