// lexcode-expect: 10
// A desktop app that installs and updates itself from a download server: Velopack's startup hook
// (through an alias) and update manager (imported, and built with target-typed new), Squirrel.Windows'
// install events and update manager (through an alias: constructed, target-typed and from GitHub
// releases), NetSparkle's appcast updater (constructed and target-typed), and a ClickOnce update
// check.
using System.Deployment.Application;
using NetSparkleUpdater;
using NetSparkleUpdater.SignatureVerifiers;
using Velopack;
using Sq = Squirrel;
using Vp = Velopack;

namespace Contoso.Ledger;

public static class Program
{
    [STAThread]
    public static void Main(string[] args)
    {
        Vp.VelopackApp.Build().Run();
        Sq.SquirrelAwareApp.HandleEvents(onInitialInstall: (_, tools) => tools.CreateShortcutForThisExe());
    }
}

public sealed class Updater
{
    private SparkleUpdater? _sparkle;

    public async Task CheckAsync()
    {
        var velopack = new UpdateManager("https://downloads.contoso.example/ledger");
        UpdateManager fallback = new("https://mirror.contoso.example/ledger");
        var update = await velopack.CheckForUpdatesAsync();

        using var squirrel = new Sq.UpdateManager("https://downloads.contoso.example/ledger-legacy");
        await squirrel.UpdateApp();
        using Sq.UpdateManager mirror = new("https://mirror.contoso.example/ledger-legacy");
        using var fromGitHub = await Sq.UpdateManager.GitHubUpdateManager("https://github.com/contoso/ledger");

        _sparkle = new SparkleUpdater("https://downloads.contoso.example/appcast.xml", new Ed25519Checker(SecurityMode.Strict, "base64-public-key"));
        SparkleUpdater beta = new("https://downloads.contoso.example/beta-appcast.xml", new Ed25519Checker(SecurityMode.Strict, "base64-public-key"));

        if (ApplicationDeployment.IsNetworkDeployed)
        {
            ApplicationDeployment.CurrentDeployment.CheckForUpdate();
        }
    }
}
