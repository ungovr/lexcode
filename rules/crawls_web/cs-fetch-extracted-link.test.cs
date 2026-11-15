// lexcode-expect: 8
using AngleSharp;
using AngleSharp.Dom;
using HtmlAgilityPack;
using Microsoft.Playwright;

namespace Research.Harvest;

// A crawler that follows the links on each page it reads to the next page, wherever they lead.
public class LinkFollower(HttpClient http, IBrowsingContext context, IPage page)
{
    public async Task FollowAsync(HtmlDocument doc, IDocument angleDoc, Uri pageUri)
    {
        foreach (var a in doc.DocumentNode.SelectNodes("//a[@href]"))
        {
            await http.GetStringAsync(a.GetAttributeValue("href", string.Empty));
            var next = a.Attributes["href"].Value;
            new HtmlWeb().Load(next);
            HtmlWeb follower = new();
            follower.Load(a.GetAttributeValue("href", ""));
        }

        foreach (var element in angleDoc.QuerySelectorAll("a"))
        {
            await context.OpenAsync(element.GetAttribute("href"));
            await http.GetByteArrayAsync(new Uri(pageUri, element.GetAttribute("src")));
        }

        foreach (var anchor in await page.QuerySelectorAllAsync("a"))
        {
            var href = await anchor.GetAttributeAsync("href");
            await page.GotoAsync(href);
        }

        foreach (var image in doc.DocumentNode.SelectNodes("//img[@src]"))
        {
            using var request = new HttpRequestMessage(HttpMethod.Get, image.GetAttributeValue("src", ""));
            using var initRequest = new HttpRequestMessage { Method = HttpMethod.Get, RequestUri = new Uri(pageUri, image.GetAttributeValue("src", "")) };
        }
    }
}
