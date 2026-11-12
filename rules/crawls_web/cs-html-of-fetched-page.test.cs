// lexcode-expect: 10
using System.Net;
using AngleSharp;
using AngleSharp.Html.Parser;
using HtmlAgilityPack;

namespace PriceWatch.Scraping;

// A scraper that downloads other sites' pages and reads their HTML.
public class ListingReader(HtmlWeb injectedWeb, IHttpClientFactory factory)
{
    private readonly HttpClient _http = new();

    // HtmlAgilityPack's HtmlWeb downloads the page itself.
    public async Task<HtmlDocument> HtmlWebAsync(string listingUrl)
    {
        var web = new HtmlWeb();
        var doc = web.Load(listingUrl);
        HtmlWeb asyncWeb = new();
        doc = await asyncWeb.LoadFromWebAsync(listingUrl);
        doc = injectedWeb.Load("https://shop.example.com/deals");

        return doc;
    }

    // HtmlAgilityPack over a page fetched in the same expression, and the line before.
    public async Task<string> HtmlDocumentAsync(string listingUrl)
    {
        var doc = new HtmlDocument();
        doc.LoadHtml(await _http.GetStringAsync(listingUrl));
        var html = await factory.CreateClient("scraper").GetStringAsync(listingUrl);
        doc.LoadHtml(html);
        await using var stream = await _http.GetStreamAsync(listingUrl);
        doc.Load(stream);
        doc.LoadHtml(new WebClient().DownloadString(listingUrl));

        return doc.DocumentNode.SelectSingleNode("//h1").InnerText;
    }

    // AngleSharp, by its own loader and over a page fetched with HttpClient.
    public async Task<int> AngleSharpAsync(string listingUrl)
    {
        var context = BrowsingContext.New(Configuration.Default.WithDefaultLoader());
        var document = await context.OpenAsync(listingUrl);
        var parsed = new HtmlParser().ParseDocument(await _http.GetStringAsync(listingUrl));
        var body = await _http.GetStringAsync(listingUrl);
        var virtualDoc = await context.OpenAsync(req => req.Content(body));

        return document.Links.Length + parsed.Links.Length + virtualDoc.Links.Length;
    }
}
