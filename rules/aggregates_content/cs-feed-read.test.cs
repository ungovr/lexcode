// lexcode-expect: 14
using System.ServiceModel.Syndication;
using System.Xml;
using CodeHollow.FeedReader;
using Microsoft.SyndicationFeed.Rss;

namespace NewsDigest.Feeds;

// A news digest that reads other publishers' RSS and Atom feeds and lists their headlines.
public class HeadlineCollector(IHttpClientFactory factory, IFeedParser feedParser)
{
    private readonly HttpClient _http = new();

    // System.ServiceModel.Syndication, over an address and over a downloaded stream.
    public async Task<int> SyndicationAsync(string feedUrl)
    {
        var first = SyndicationFeed.Load(XmlReader.Create(feedUrl));
        var literal = SyndicationFeed.Load(XmlReader.Create("https://example.com/content/feed.xml"));

        using var reader = XmlReader.Create("https://news.example.com/rss");
        var second = SyndicationFeed.Load(reader);

        await using var stream = await _http.GetStreamAsync(feedUrl);
        using var xml = XmlReader.Create(stream);
        var third = SyndicationFeed.Load(xml);

        await using var body = await _http.GetStreamAsync(feedUrl);
        var fourth = SyndicationFeed.Load(XmlReader.Create(body));

        // A feed address built on a base the reader holds for the publisher.
        var onBase = await _http.GetStreamAsync($"{feedUrl}/rss/{DateTime.UtcNow.Year}");
        var fifth = SyndicationFeed.Load(XmlReader.Create(onBase));

        Rss20FeedFormatter formatter = new();
        formatter.ReadFrom(XmlReader.Create(feedUrl));
        var atom = new Atom10FeedFormatter();
        atom.ReadFrom(XmlReader.Create(await _http.GetStreamAsync(feedUrl)));

        return first.Items.Count() + second.Items.Count() + third.Items.Count() + fourth.Items.Count();
    }

    // Microsoft.SyndicationFeed.ReaderWriter.
    public RssFeedReader Streaming(string feedUrl)
    {
        return new RssFeedReader(XmlReader.Create(feedUrl, new XmlReaderSettings { Async = true }));
    }

    // CodeHollow.FeedReader.
    public async Task<int> FeedReaderAsync(string feedUrl)
    {
        var feed = await FeedReader.ReadAsync(feedUrl);
        var found = await FeedReader.GetFeedUrlsFromUrlAsync("https://blog.example.org");

        return feed.Items.Count + found.Count();
    }

    // A feed parser of the app's own over a feed it downloads.
    public async Task<object> OwnParserAsync(string feedUrl)
    {
        var parsed = feedParser.Parse(await factory.CreateClient("feeds").GetStringAsync(feedUrl));
        var fresh = await RssFeed.LoadAsync(await new HttpClient().GetStreamAsync(feedUrl));
        await using var news = await _http.GetStreamAsync(feedUrl);

        return await NewsFeed.LoadAsync(news);
    }
}
