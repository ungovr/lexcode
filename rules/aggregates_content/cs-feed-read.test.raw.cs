// lexcode-expect: 6
using System.ServiceModel.Syndication;
using System.Xml;

namespace NewsDigest.Feeds;

// Feed addresses written as C# 11 raw string literals. The third load is matched twice: as a reader
// over a stream downloaded in the same call, and as a loader named for a syndication feed.
public class RawHeadlineCollector(HttpClient http)
{
    public async Task<int> ReadAsync(int year)
    {
        var first = SyndicationFeed.Load(XmlReader.Create("""https://example.com/content/feed.xml"""));
        using var reader = XmlReader.Create("""https://news.example.com/rss""");
        var second = SyndicationFeed.Load(reader);
        var third = SyndicationFeed.Load(XmlReader.Create(await http.GetStreamAsync("""https://news.example.com/rss""")));
        await using var stream = await http.GetStreamAsync($"""https://news.example.com/{year}/rss""");
        var fourth = SyndicationFeed.Load(XmlReader.Create(stream));
        var fifth = SyndicationFeed.Load(XmlReader.Create("""
            https://news.example.com/atom
            """));

        return first.Items.Count() + second.Items.Count() + third.Items.Count() + fourth.Items.Count() + fifth.Items.Count();
    }
}
