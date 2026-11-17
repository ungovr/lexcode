// lexcode-expect: 7
using AngleSharp;
using HtmlAgilityPack;

namespace PriceWatch.Scraping;

// Addresses written as C# 11 raw string literals, on one line, interpolated and over several lines.
public class RawListingReader(HttpClient http)
{
    public async Task ReadAsync(int n)
    {
        var web = new HtmlWeb();
        web.Load("""https://raw.example.com/deals""");
        var context = BrowsingContext.New(Configuration.Default.WithDefaultLoader());
        await context.OpenAsync("""https://raw.example.com/deals""");
        var doc = new HtmlDocument();
        doc.LoadHtml(await http.GetStringAsync("""https://raw.example.com/deals"""));
        var page = await http.GetStringAsync($"""https://raw.example.com/page/{n}""");
        doc.LoadHtml(page);
        doc.LoadHtml(await http.GetStringAsync(""""https://raw.example.com/"quoted"/deals""""));
        doc.LoadHtml(await http.GetStringAsync($$"""https://raw.example.com/page/{{n}}"""));
        web.Load("""
            https://raw.example.com/deals
            """);
    }
}
