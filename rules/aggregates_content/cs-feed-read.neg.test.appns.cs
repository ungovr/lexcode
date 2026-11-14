// lexcode-expect: 0
using System.Xml;
using Shop.Activity;

namespace Shop.Activity.Web;

// The app's own FeedReader, SyndicationFeed, Rss20FeedFormatter, RssFeedReader and AtomFeedReader
// classes in its own namespace, with the same short names and method names as
// CodeHollow.FeedReader's, System.ServiceModel.Syndication's and Microsoft.SyndicationFeed's. They
// read the app's own activity feed, so none of these calls is taken for reading another
// publisher's feed.
public class ActivityPage(Rss20FeedFormatter formatter)
{
    public async Task ShowAsync(string activityFeedUrl)
    {
        var mine = await FeedReader.ReadAsync(activityFeedUrl);
        var urls = await FeedReader.GetFeedUrlsFromUrlAsync(activityFeedUrl);
        var feed = SyndicationFeed.Load(XmlReader.Create(activityFeedUrl));
        formatter.ReadFrom(XmlReader.Create(activityFeedUrl));
        var rss = new RssFeedReader(XmlReader.Create(activityFeedUrl));
        var atom = new AtomFeedReader(XmlReader.Create(activityFeedUrl));
    }
}
