// lexcode-expect: 3
using Net = System.Net;
using Http = System.Net.Http;

namespace Research.Harvest;

// The same clients reached through aliases. The injected client's name says nothing about HTTP, so
// only its declared type marks it.
public class AliasedUrlListFetcher(Http.HttpClient downloader)
{
    public async Task FetchAllAsync(string[] urls)
    {
        foreach (var url in urls)
        {
            await downloader.GetStringAsync(url);
            Net.WebClient legacy = new();
            legacy.DownloadData(url);
            var request = Net.WebRequest.Create(url);
        }
    }
}
