// lexcode-expect: 2
/* Scraper for the deals page.
   Written against the public site. */
namespace PriceWatch.Scraping;

// AngleSharp named in full on a code line, after a string that holds `//` and with a comment
// after the code, and block comments before and after it: the name on the code line counts.
public class QualifiedListingReader
{
    public async Task<int> ReadAsync(string listingUrl)
    {
        var home = "https://deals.example.com/"; var context = AngleSharp.BrowsingContext.New(AngleSharp.Configuration.Default.WithDefaultLoader()); // the loader downloads
        /* The loader follows redirects. */
        var document = await context.OpenAsync(listingUrl);
        var again = await context.OpenAsync(home);

        return document.Links.Length + again.Links.Length;
    }
}
