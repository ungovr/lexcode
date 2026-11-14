// lexcode-expect: 0
// Timers that send nothing (a cache refresh, a session purge), a receipt sent from a controller action that a person
// triggered, and the app's own IJob and RecurringJob (a build pipeline in the app's namespace), which are not Quartz's
// or Hangfire's.
using App.Pipelines;

namespace App.Maintenance;

public class CacheWarmer(ICatalogCache cache) : Microsoft.Extensions.Hosting.IHostedService
{
    private System.Threading.Timer? _timer;

    public Task StartAsync(CancellationToken ct)
    {
        _timer = new System.Threading.Timer(_ => cache.Refresh(), null, TimeSpan.Zero, TimeSpan.FromMinutes(5));
        return Task.CompletedTask;
    }

    public Task StopAsync(CancellationToken ct) => Task.CompletedTask;
}

public class SessionPurge(ISessionStore sessions) : Quartz.IJob
{
    public Task Execute(Quartz.IJobExecutionContext context) => sessions.PurgeExpiredAsync();
}

public class ReceiptController(Microsoft.AspNetCore.Identity.UI.Services.IEmailSender emailSender)
{
    public Task Checkout(string email) => emailSender.SendEmailAsync(email, "Your receipt", "Thanks for your order.");
}

public class NightlyBuild(IMailer mailer) : IJob
{
    public Task Run() => mailer.SendAsync("builds@example.com", "Nightly build finished");

    public void Register() => RecurringJob.AddOrUpdate("nightly", () => mailer.SendEmailAsync("builds@example.com"));
}
