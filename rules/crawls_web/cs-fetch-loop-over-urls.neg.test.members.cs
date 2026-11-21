// lexcode-expect: 0
namespace Shop.Settings;

// Clients that read a value by name, not an address, held the same ways: a nullable field and a
// nullable property read through `this.`, and a type whose name holds "Client" but not HttpClient.
public class SecretsClient { public Task<string> GetStringAsync(string name) => Task.FromResult(name); }

public class SettingsLoader
{
    private ISecretsClient? _secretsClient;
    public IFeatureFlagClient? FlagClient { get; set; }

    public async Task LoadAsync(IEnumerable<string> names, SecretsClient vaultClient)
    {
        foreach (var name in names)
        {
            await this._secretsClient.GetStringAsync(name);
            await this.FlagClient.GetStringAsync(name);
            await vaultClient.GetStringAsync(name);
        }
    }
}
