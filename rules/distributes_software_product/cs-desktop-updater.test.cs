// lexcode-expect: 7
// A desktop app that installs and updates itself from a download server: Velopack's startup hook and
// update manager (imported, and built with target-typed new), Squirrel.Windows' install events and
// update manager (reached through an alias), NetSparkle's appcast updater, and a ClickOnce update
// check.
using System.Deployment.Application;
using NetSparkleUpdater;
using NetSparkleUpdater.SignatureVerifiers;
using Velopack;
using Sq = Squirrel;

namespace Contoso.Ledger;

public static class Program
{
    [STAThread]
    public static void Main(string[] args)
    {
        VelopackApp.Build().Run();
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

        _sparkle = new SparkleUpdater("https://downloads.contoso.example/appcast.xml", new Ed25519Checker(SecurityMode.Strict, "base64-public-key"));

        if (ApplicationDeployment.IsNetworkDeployed)
        {
            ApplicationDeployment.CurrentDeployment.CheckForUpdate();
        }
    }
}
