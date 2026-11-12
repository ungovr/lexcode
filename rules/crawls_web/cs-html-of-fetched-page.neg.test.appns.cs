// lexcode-expect: 0
using Shop.Content.Html;

namespace Shop.Content;

// The app's own HtmlWeb class in its own namespace, with the same short name and method names as
// HtmlAgilityPack's. It renders the app's own Razor pages to HTML, so none of these calls is taken
// for downloading another site's page.
public class OwnPages(HtmlWeb web)
{
    public async Task RenderAsync(string pageUrl)
    {
        var document = web.Load(pageUrl);
        var other = await web.LoadFromWebAsync(pageUrl);
        HtmlWeb local = new();
        local.Load(pageUrl);
    }
}
