// lexcode-expect: 0
using System.ServiceModel.Syndication;
using System.Xml;
using CodeHollow.FeedReader;
using Microsoft.Extensions.Caching.Distributed;

namespace Shop.Blog;

// The app publishes its own blog as RSS, reads back its own feed file and cached copies, and reads a
// feed from its own dev server. Nothing here reads another publisher's feed.
public class BlogFeed(IDistributedCache cache)
{
    public void Publish(IEnumerable<SyndicationItem> posts, XmlWriter writer)
    {
        var feed = new SyndicationFeed("Shop blog", "News from the shop", new Uri("https://shop.example.com/blog"), posts);
        new Rss20FeedFormatter(feed).WriteTo(writer);
        feed.SaveAsAtom10(writer);
    }

    public async Task<int> ReadBackAsync(string feedPath, string storedXml, string key)
    {
        var own = SyndicationFeed.Load(XmlReader.Create(feedPath));
        using var reader = XmlReader.Create(new StringReader(storedXml));
        var stored = SyndicationFeed.Load(reader);
        var file = FeedReader.ReadFromFile("App_Data/blog.xml");
        var parsed = FeedReader.ReadFromString(storedXml);
        var cached = await BlogFeedParser.ParseAsync(await cache.GetStringAsync(key));

        return own.Items.Count() + stored.Items.Count() + file.Items.Count + parsed.Items.Count + cached;
    }

    public async Task PreviewAsync()
    {
        var local = SyndicationFeed.Load(XmlReader.Create("http://localhost:5000/blog/rss"));
        var dev = await FeedReader.ReadAsync("http://127.0.0.1:5000/blog/rss");
    }
}
