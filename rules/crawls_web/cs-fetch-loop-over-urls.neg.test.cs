// lexcode-expect: 0
using Microsoft.Extensions.Caching.Distributed;

namespace Shop.Sync;

// Loops that are not fetching a list of addresses: product ids sent to the app's own API, cache
// keys read from a distributed cache, files read from disk, webhooks delivered to subscribers by
// POST, secrets and flags read by name through typed wrapper clients, and one call to a documented
// partner API outside any loop.
public class CatalogSync(HttpClient http, IDistributedCache cache, ISecretsClient secretsClient)
{
    private readonly IFeatureFlagClient _flagClient;

    // Typed wrapper clients named for a client, whose GetStringAsync reads a secret or a flag by its
    // name, not an address: their declared types are not HttpClient.
    public async Task LoadSettingsAsync(IEnumerable<string> secretNames, IEnumerable<string> flagNames)
    {
        foreach (var name in secretNames)
        {
            await secretsClient.GetStringAsync(name);
        }

        foreach (var flag in flagNames)
        {
            await _flagClient.GetStringAsync(flag);
            await this._flagClient.GetStringAsync(flag);
        }
    }

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
