// lexcode-expect: 6
using System.Net;
using HtmlAgilityPack;

namespace PriceWatch.Scraping;

// System.Net.WebClient downloading the page: built inline in the parser call or the line before,
// held in a local, by its short name under `using System.Net;` and written in full.
public class WebClientListingReader
{
    public async Task<string> ReadAsync(string listingUrl)
    {
        var doc = new HtmlDocument();
        doc.LoadHtml(new WebClient().DownloadString(listingUrl));
        doc.LoadHtml(await new WebClient().DownloadStringTaskAsync(listingUrl));
        var html = new WebClient().DownloadString(listingUrl);
        doc.LoadHtml(html);
        var wc = new WebClient();
        doc.LoadHtml(wc.DownloadString(listingUrl));
        doc.Load(new System.Net.WebClient().OpenRead("https://shop.example.com/deals"));
        using var client = new WebClient();
        doc.Load(client.OpenRead(listingUrl));

        return doc.DocumentNode.SelectSingleNode("//h1").InnerText;
    }
}
