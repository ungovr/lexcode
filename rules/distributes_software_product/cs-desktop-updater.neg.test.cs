// lexcode-expect: 0
// A web service the operator runs, which ships nothing to install: a hosted job refreshes exchange
// rates from an API, and the app's own UpdateManager in another namespace applies database updates.
using Contoso.Storefront.Data;

namespace Contoso.Storefront;

public sealed class RatesRefresher(IHttpClientFactory http, UpdateManager updates) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var client = http.CreateClient("rates");
        var rates = await client.GetStringAsync("https://rates.contoso.example/latest", stoppingToken);
        await updates.ApplyPendingAsync(stoppingToken);

        var manager = new UpdateManager("Server=db;Database=shop");
        UpdateManager other = new("Server=db2;Database=shop");
        await manager.CheckForUpdatesAsync();
    }
}
