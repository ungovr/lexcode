// lexcode-expect: 1
using Microsoft.Playwright;

namespace PriceWatch.Scraping;

public class LineCommentGlob(IPage page)
{
    /// <summary>Sends Accept: */* and saves each shot.</summary>
    public async Task OpenAsync(string listingUrl)
    {
        await page.GotoAsync(listingUrl); // a line comment that holds */ is not the end of a block comment
    }
}
