// lexcode-expect: 0
using AngleSharp;
using HtmlAgilityPack;

namespace Shop.Content;

// The app's own pages and a blank page, written as raw string literals: loopback, a path relative
// to the client's BaseAddress, and about:blank.
public class RawPreview(HttpClient http)
{
    public async Task PreviewAsync(int id)
    {
        var web = new HtmlWeb();
        web.Load("""http://localhost:5000/newsletter/preview""");
        web.Load("""newsletter/preview.html""");
        var doc = new HtmlDocument();
        doc.LoadHtml(await http.GetStringAsync("""pages/preview"""));
        doc.LoadHtml(await http.GetStringAsync($"""pages/{id}"""));
        var page = await http.GetStringAsync("""http://127.0.0.1:5000/newsletter/preview""");
        doc.LoadHtml(page);
        var blank = await BrowsingContext.New(Configuration.Default).OpenAsync("""about:blank""");
        web.Load("""
            http://localhost:5000/newsletter/preview
            """);
    }
}
