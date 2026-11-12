using AngleSharp;
// lexcode-expect: 1

namespace PriceWatch.Scraping;

// A file saved with a UTF-8 byte order mark, as Visual Studio saves one, whose first line is
// AngleSharp's using.
public class BomListingReader(IBrowsingContext context)
{
    public async Task ReadAsync(string listingUrl)
    {
        var document = await context.OpenAsync(listingUrl);
    }
}
