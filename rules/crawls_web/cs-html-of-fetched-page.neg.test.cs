// lexcode-expect: 0
using System.Data.Common;
using AngleSharp;
using AngleSharp.Html.Parser;
using HtmlAgilityPack;
using Microsoft.Extensions.Caching.Distributed;

namespace Shop.Content;

// The app parses HTML it already holds: posts its users wrote, its own templates on disk, cached
// copies, and pages from its own server. It also calls a documented partner API for JSON. Nothing
// here downloads another site's page and reads its HTML.
public class PostSanitizer(IDistributedCache cache, HttpClient http, DbConnection connection)
{
    public string Sanitize(string postBody, string templatePath)
    {
        var doc = new HtmlDocument();
        doc.LoadHtml(postBody);
        doc.Load(templatePath);
        doc.Load(File.OpenRead(templatePath));

        return doc.DocumentNode.InnerText;
    }

    public async Task<string> CachedAsync(string key, string cacheUrl)
    {
        var doc = new HtmlDocument();
        doc.LoadHtml(await cache.GetStringAsync(key));
        var cached = await cache.GetStringAsync(cacheUrl);
        doc.LoadHtml(cached);

        return doc.DocumentNode.InnerText;
    }

    // AngleSharp over HTML the app holds, and a database connection opened in the same file.
    public async Task<int> AngleAsync(string template, CancellationToken cancellationToken)
    {
        await connection.OpenAsync(cancellationToken);
        var context = BrowsingContext.New(Configuration.Default);
        var document = await context.OpenAsync(req => req.Content(template));
        var parsed = new HtmlParser().ParseDocument(template);

        return document.QuerySelectorAll("p").Length + parsed.Links.Length;
    }

    // The app's own server, on loopback and by relative path.
    public async Task PreviewAsync()
    {
        var web = new HtmlWeb();
        web.Load("http://localhost:5000/newsletter/preview");
        var doc = new HtmlDocument();
        doc.LoadHtml(await http.GetStringAsync("/newsletter/preview"));
        var html = await http.GetStringAsync("http://127.0.0.1:5000/newsletter/preview");
        doc.LoadHtml(html);
    }

    // A documented partner API returning JSON, never parsed as HTML.
    public async Task<string> StarsAsync()
    {
        return await http.GetStringAsync("https://api.github.com/repos/dotnet/aspnetcore");
    }
}
