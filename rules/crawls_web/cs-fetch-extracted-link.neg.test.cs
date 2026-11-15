// lexcode-expect: 0
using AngleSharp.Dom;
using HtmlAgilityPack;

namespace Shop.Content;

// Reading links out of HTML the app holds is not following them: the links are listed, their hosts
// counted, their addresses rewritten in posts users wrote, or joined onto the app's own server. The
// one fetch here is of an address that did not come from a page.
public class LinkReport(HttpClient http)
{
    public List<string> Hrefs(HtmlDocument post, IDocument stored)
    {
        var hrefs = new List<string>();
        foreach (var a in post.DocumentNode.SelectNodes("//a[@href]"))
        {
            hrefs.Add(a.GetAttributeValue("href", ""));
            hrefs.Add(new Uri(a.Attributes["href"].Value).Host);
            a.SetAttributeValue("rel", "nofollow");
        }

        foreach (var element in stored.QuerySelectorAll("a"))
        {
            hrefs.Add(element.GetAttribute("href"));
        }

        return hrefs;
    }

    // The app's own API, with a link taken from its own response as a path.
    public async Task<string> OwnNextAsync(IElement nextLink)
    {
        await http.GetStringAsync("http://localhost:5000" + nextLink.GetAttribute("href"));
        var next = nextLink.GetAttribute("data-page");
        return await http.GetStringAsync($"/api/orders?page={next}");
    }

    // A fetch of an address that did not come from a page.
    public async Task<string> ConfiguredAsync(string feedUrl)
    {
        return await http.GetStringAsync(feedUrl);
    }
}
