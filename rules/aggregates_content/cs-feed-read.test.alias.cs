// lexcode-expect: 4
using Syn = System.ServiceModel.Syndication;
using Xml = System.Xml;
using Feeds = CodeHollow.FeedReader;
using MsRss = Microsoft.SyndicationFeed.Rss.RssFeedReader;

namespace NewsDigest.Feeds;

// The same readers reached through aliases, with the formatter injected.
public class AliasedHeadlineCollector(Syn.Rss20FeedFormatter formatter)
{
    public async Task CollectAsync(string feedUrl)
    {
        var feed = Syn.SyndicationFeed.Load(Xml.XmlReader.Create(feedUrl));
        var read = await Feeds.FeedReader.ReadAsync(feedUrl);
        var streaming = new MsRss(Xml.XmlReader.Create(feedUrl));
        formatter.ReadFrom(Xml.XmlReader.Create(feedUrl));
    }
}
