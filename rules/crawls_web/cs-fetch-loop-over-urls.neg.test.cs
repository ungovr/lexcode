// lexcode-expect: 0
using Microsoft.Extensions.Caching.Distributed;

namespace Shop.Sync;

// Loops that are not fetching a list of addresses: product ids sent to the app's own API, cache
// keys read from a distributed cache, files read from disk, webhooks delivered to subscribers by
// POST, and one call to a documented partner API outside any loop.
public class CatalogSync(HttpClient http, IDistributedCache cache)
{
    public async Task SyncAsync(IEnumerable<int> productIds, IEnumerable<string> cacheKeys, IEnumerable<string> paths)
    {
        foreach (var id in productIds)
        {
            await http.GetStringAsync($"/api/products/{id}");
        }

        foreach (var key in cacheKeys)
        {
            await cache.GetStringAsync(key);
        }

        foreach (string path in paths)
        {
            await File.ReadAllTextAsync(path);
        }

        var stock = await http.GetStringAsync("https://api.partner.example.com/v1/stock");
    }

    public async Task DeliverWebhooksAsync(IReadOnlyList<string> subscriberUrls, HttpContent payload)
    {
        foreach (var subscriberUrl in subscriberUrls)
        {
            await http.PostAsync(subscriberUrl, payload);
            using var post = new HttpRequestMessage { Method = HttpMethod.Post, RequestUri = new Uri(subscriberUrl), Content = payload };
            using var put = new HttpRequestMessage(HttpMethod.Put, subscriberUrl) { Content = payload };
        }

        await Parallel.ForEachAsync(subscriberUrls, async (url, ct) => await http.PutAsync(url, payload, ct));
    }
}
