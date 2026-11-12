// lexcode-expect: 9
using System.Net;

namespace Research.Harvest;

// A harvester that downloads every address in a list it was given.
public class UrlListFetcher(IHttpClientFactory factory)
{
    private readonly HttpClient _http = new();

    public async Task FetchAllAsync(IEnumerable<string> urls, List<Uri> seeds)
    {
        foreach (var url in urls)
        {
            var html = await _http.GetStringAsync(url);
        }

        foreach (Uri seed in seeds)
        {
            using var response = await _http.GetAsync(seed);
        }

        foreach (var pageUrl in urls)
        {
            await factory.CreateClient("harvester").GetByteArrayAsync(pageUrl);
            using var request = new HttpRequestMessage(HttpMethod.Get, pageUrl);
        }

        await Parallel.ForEachAsync(urls, async (link, ct) =>
        {
            await _http.GetStreamAsync(link, ct);
        });

        var pages = await Task.WhenAll(urls.Select(u => _http.GetStringAsync(u)));
        var bodies = urls.Select(async address => await _http.GetStringAsync(address));
        seeds.ForEach(s => new WebClient().DownloadString(s));

        foreach (var target in urls)
        {
            var legacy = WebRequest.Create(target);
        }
    }
}
