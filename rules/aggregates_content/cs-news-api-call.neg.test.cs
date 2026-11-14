// lexcode-expect: 0
using Shop.News;

namespace Shop.News.Web;

// The app's own NewsApiClient in its own namespace, with the same short name and method names as
// the News API client's, serves the shop's own announcements. A link to a newspaper's own section
// page is a link a person follows, not a feed of its articles. See https://newsapi.org/docs for
// the API this app does not use.
public class Announcements(NewsApiClient announcements, HttpClient http)
{
    private const string PressLink = "https://www.nytimes.com/section/business";

    public async Task ShowAsync()
    {
        var top = announcements.GetTopHeadlines(new TopHeadlinesRequest { Category = "store" });
        var all = await announcements.GetEverythingAsync(new EverythingRequest());
        var own = new NewsApiClient("internal");
        own.GetEverything(new EverythingRequest());
        await http.GetStringAsync("/api/announcements");
    }
}
