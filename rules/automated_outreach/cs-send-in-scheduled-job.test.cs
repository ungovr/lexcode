// lexcode-expect: 6
// Sends that a clock starts, not a person: a hosted worker on a PeriodicTimer, a System.Threading.Timer callback (also
// target-typed), a System.Timers.Timer Elapsed handler, and Azure Functions timer triggers (isolated worker and
// in-process).
using Microsoft.AspNetCore.Identity.UI.Services;
using Microsoft.Azure.Functions.Worker;
using Twilio.Rest.Api.V2010.Account;

namespace App.Reminders;

public class ReminderWorker(IEmailSender emailSender, IAppointments appointments) : Microsoft.Extensions.Hosting.BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(TimeSpan.FromHours(1));
        while (await timer.WaitForNextTickAsync(stoppingToken))
        {
            var next = await appointments.NextDueAsync(stoppingToken);
            await emailSender.SendEmailAsync(next.Email, "Your appointment is tomorrow", next.Html);
        }
    }
}

public class DailyDigest(IDigestSender digests)
{
    private Timer? _timer;
    private System.Threading.Timer? _second;

    public void Start()
    {
        _timer = new Timer(_ => digests.SendDailyDigestAsync(), null, TimeSpan.Zero, TimeSpan.FromDays(1));
        System.Threading.Timer second = new(_ => digests.SendDailyDigestAsync(), null, TimeSpan.Zero, TimeSpan.FromDays(1));
        _second = second;
    }

    public void Legacy()
    {
        var timer = new System.Timers.Timer(TimeSpan.FromHours(6));
        timer.Elapsed += async (s, e) => await digests.SendDailyDigestAsync();
        timer.Start();
    }
}

public class Functions(IEmailSender emailSender)
{
    [Function("WeeklyNewsletter")]
    public async Task Run([TimerTrigger("0 0 9 * * MON")] TimerInfo timer)
    {
        await emailSender.SendEmailAsync("subscribers@example.com", "This week", "<p>News</p>");
    }

    [Microsoft.Azure.WebJobs.FunctionName("TextReminders")]
    public static void Reminders([Microsoft.Azure.WebJobs.TimerTrigger("0 0 8 * * *")] Microsoft.Azure.WebJobs.TimerInfo timer)
    {
        MessageResource.Create(to: new Twilio.Types.PhoneNumber("+15550100"), from: new Twilio.Types.PhoneNumber("+15550101"), body: "Pick-up day is tomorrow.");
    }
}
