// lexcode-expect: 5
using System.Net.Http.Json;
using NewsAPI;
using NewsAPI.Models;

namespace NewsDigest.Sources;

// A digest that pulls headlines and article snippets from news APIs.
public class HeadlineSource(HttpClient http, string apiKey)
{
    public async Task CollectAsync(string topic)
    {
        var top = await http.GetFromJsonAsync<object>("https://newsapi.org/v2/top-headlines?country=us");
        var search = await http.GetStringAsync($"https://gnews.io/api/v4/search?q={topic}&apikey={apiKey}");
        http.BaseAddress = new Uri("https://content.guardianapis.com/");

        var client = new NewsApiClient(apiKey);
        var headlines = client.GetTopHeadlines(new TopHeadlinesRequest { Country = Countries.US });
        NewsApiClient asyncClient = new(apiKey);
        var everything = await asyncClient.GetEverythingAsync(new EverythingRequest { Q = topic });
    }
}
