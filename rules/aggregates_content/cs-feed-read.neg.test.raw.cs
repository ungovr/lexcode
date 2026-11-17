// lexcode-expect: 0
using System.ServiceModel.Syndication;
using System.Xml;

namespace Shop.Blog;

// The app's own feed, written as raw string literals: its dev server and a path relative to the
// client's BaseAddress.
public class RawBlogPreview(HttpClient http)
{
    public async Task PreviewAsync(int id)
    {
        var local = SyndicationFeed.Load(XmlReader.Create("""http://localhost:5000/blog/rss"""));
        var relative = SyndicationFeed.Load(XmlReader.Create(await http.GetStreamAsync("""blog/rss""")));
        await using var stream = await http.GetStreamAsync($"""blog/{id}/rss""");
        var own = SyndicationFeed.Load(XmlReader.Create(stream));
    }
}
