// lexcode-expect: 1
using AngleSharp;

namespace PriceWatch.Scraping;

// A browser's default Accept header after the using: its star-slash-star is inside a string, not the end of
// a block comment; so is the star-slash of an interpolated string.
public class AcceptingReader(HttpClient http)
{
    public async Task<int> ReadAsync(string listingUrl, string kind)
    {
        http.DefaultRequestHeaders.Add("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8");
        var pattern = $"{kind}/**/*.html";
        var context = BrowsingContext.New(Configuration.Default.WithDefaultLoader());
        var document = await context.OpenAsync(listingUrl);
        return document.Links.Length;
    }
}
