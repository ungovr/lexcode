// lexcode-expect: 1
using AngleSharp;

namespace PriceWatch.Scraping;

// Interpolated verbatim strings after the using, one ending in a backslash and one holding a star-slash.
public class VerbatimReader
{
    public async Task<int> ReadAsync(string listingUrl, string site)
    {
        var cache = Path.Combine($@"C:\cache\{site}\", "**/*.html");
        var glob = @$"{site}\**/*.html";
        var context = BrowsingContext.New(Configuration.Default.WithDefaultLoader());
        var document = await context.OpenAsync(listingUrl);
        return document.Links.Length + cache.Length + glob.Length;
    }
}
