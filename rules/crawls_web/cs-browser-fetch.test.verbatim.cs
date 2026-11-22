// lexcode-expect: 1
using Microsoft.Playwright;

namespace PriceWatch.Scraping;

// Verbatim strings (a backslash is not an escape in them, and `""` is a quote) after the using:
// one ends in a backslash before a glob on its line, one holds a star-slash; none is a comment mark.
public class VerbatimShots(IPage page)
{
    public async Task OpenAsync(string listingUrl)
    {
        await page.GotoAsync(listingUrl);
        var shot = Path.Combine(@"C:\shots\", "all", "**/*.png");
        var glob = @"say ""all"" **/*.png";
        await page.ScreenshotAsync(new() { Path = shot + glob });
    }
}
