// lexcode-expect: 1
using AngleSharp;

namespace PriceWatch.Scraping;

// A raw string literal holding quotes and a star-slash after the using, on one line and on several.
public class RawStarReader
{
    private const string Accept = """text/html, "quoted */*;q=0.8""";
    private const string Note = $$"""
        {"glob": "{{Accept}}/**/*.html"}
        """;

    public async Task<int> ReadAsync(string listingUrl)
    {
        var context = BrowsingContext.New(Configuration.Default.WithDefaultLoader());
        var document = await context.OpenAsync(listingUrl);
        return document.Links.Length;
    }
}
