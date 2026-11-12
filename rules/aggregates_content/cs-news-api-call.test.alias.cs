// lexcode-expect: 2
using News = NewsAPI;
using NewsModels = NewsAPI.Models;

namespace NewsDigest.Sources;

// The News API client reached through an alias, injected and constructed.
public class AliasedHeadlineSource(News.NewsApiClient injected, string apiKey)
{
    public async Task CollectAsync()
    {
        var top = await injected.GetTopHeadlinesAsync(new NewsModels.TopHeadlinesRequest());
        var all = new News.NewsApiClient(apiKey).GetEverything(new NewsModels.EverythingRequest());
    }
}
