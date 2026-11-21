// lexcode-expect: 1
using PuppeteerSharp;

namespace PriceWatch.Scraping;

// A raw string literal on several lines, holding quotes and a star-slash, after the using.
public class RawHeaders
{
    private const string Headers = """
        {"Accept": "*/*", "Note": "a "quote */* in a header"}
        """;

    public async Task OpenAsync(IPage tab, string listingUrl)
    {
        await tab.GoToAsync(listingUrl);
    }
}
