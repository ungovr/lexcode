// lexcode-expect: 0
using Shop.Content.Html;

namespace Shop.Content;

// The app's own HtmlWeb, HtmlDocument, HtmlParser and IBrowsingContext types in its own namespace,
// with the same short names and method names as HtmlAgilityPack's and AngleSharp's. They render and
// store pages of the operator's own content service, so none of these calls is taken for
// downloading another site's page and reading its HTML.
public class OwnPages(HtmlWeb web, IBrowsingContext context, HttpClient contentService)
{
    public async Task RenderAsync(string pageUrl)
    {
        var document = web.Load(pageUrl);
        var other = await web.LoadFromWebAsync(pageUrl);
        HtmlWeb local = new();
        local.Load(pageUrl);

        var stored = new HtmlDocument();
        stored.LoadHtml(await contentService.GetStringAsync(pageUrl));
        HtmlParser parser = new();
        parser.ParseDocument(await contentService.GetStringAsync(pageUrl));
        var opened = await context.OpenAsync(pageUrl);
    }
}
