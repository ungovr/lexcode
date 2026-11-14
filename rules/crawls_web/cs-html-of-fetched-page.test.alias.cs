// lexcode-expect: 4
using Hap = HtmlAgilityPack;
using Ang = AngleSharp;
using AngleParser = AngleSharp.Html.Parser.HtmlParser;

namespace PriceWatch.Scraping;

// The same parsers reached through aliases, with the browsing context injected.
public class AliasedListingReader(Ang.IBrowsingContext context, HttpClient http)
{
    public async Task ReadAsync(string listingUrl)
    {
        var doc = new Hap.HtmlWeb().Load(listingUrl);
        Hap.HtmlDocument page = new();
        page.LoadHtml(await http.GetStringAsync(listingUrl));
        var parsed = new AngleParser().ParseDocument(await http.GetStringAsync(listingUrl));
        var opened = await context.OpenAsync(listingUrl);
    }
}
