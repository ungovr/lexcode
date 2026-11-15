// lexcode-expect: 2
using Hap = HtmlAgilityPack;
using Http = System.Net.Http;

namespace Research.Harvest;

// The same libraries reached through aliases, with the client injected under a name that says
// nothing about HTTP.
public class AliasedLinkFollower(Http.HttpClient downloader, Hap.HtmlWeb web)
{
    public async Task FollowAsync(Hap.HtmlDocument doc)
    {
        foreach (var a in doc.DocumentNode.SelectNodes("//a[@href]"))
        {
            await downloader.GetStringAsync(a.GetAttributeValue("href", ""));
            web.Load(a.GetAttributeValue("href", ""));
        }
    }
}
