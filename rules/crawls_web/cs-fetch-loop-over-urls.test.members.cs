// lexcode-expect: 6
namespace PriceWatch.Crawling;

// HttpClient held in a nullable field or property and read through `this.` (the engine gives such a
// receiver no type of its own), a nullable field read bare, and a subclass of HttpClient: each is
// an HTTP client fetching every address in the list.
public class PriceHttpClient : HttpClient { }

public class MemberFetcher
{
    private HttpClient? _client;
    private System.Net.Http.HttpClient? _backup;
    public HttpClient? Http { get; set; }

    public async Task FetchAsync(IEnumerable<string> urls, PriceHttpClient priceClient)
    {
        foreach (var url in urls)
        {
            await this._client.GetStringAsync(url);
            await this._backup.GetStreamAsync(url);
            await this.Http.GetByteArrayAsync(url);
            await _client.GetStringAsync(url);
            await priceClient.GetStringAsync(url);
        }
    }

    public async Task FetchOneAsync(IEnumerable<string> urls, System.Net.Http.HttpClient? shared)
    {
        foreach (var url in urls) { await shared.GetStringAsync(url); }
    }
}
