// lexcode-expect: 10
// More timer shapes and the rest of the send set: a System.Threading.Timer constructed fully qualified and declared
// target-typed under its short name, each callback sending a text, a call, a push or an email; Firebase in its fully
// qualified, short and injected forms; an SMTP client; the app's own send method; Hangfire's injected manager with a
// generic job; and a Quartz job with no other base.
using FirebaseAdmin.Messaging;
using Hangfire;
using Quartz;
using Twilio.Rest.Api.V2010.Account;
using Twilio.Types;

namespace App.Reminders;

public class Timers(FirebaseMessaging fcm, System.Net.Mail.SmtpClient smtpClient, IRecurringJobManager manager)
{
    private readonly List<IDisposable> _timers = [];

    public void Start()
    {
        _timers.Add(new System.Threading.Timer(_ => MessageResource.CreateAsync(to: new PhoneNumber("+15550100"), from: new PhoneNumber("+15550101"), body: "Pick-up day is tomorrow."), null, 0, 86_400_000));
        _timers.Add(new System.Threading.Timer(_ => CallResource.Create(to: new PhoneNumber("+15550100"), from: new PhoneNumber("+15550101"), url: new Uri("https://example.com/voice.xml")), null, 0, 86_400_000));
        _timers.Add(new System.Threading.Timer(_ => CallResource.CreateAsync(to: new PhoneNumber("+15550100"), from: new PhoneNumber("+15550101"), url: new Uri("https://example.com/voice.xml")), null, 0, 86_400_000));
        _timers.Add(new System.Threading.Timer(_ => FirebaseMessaging.DefaultInstance.SendAsync(new Message { Topic = "deals" }), null, 0, 86_400_000));
        _timers.Add(new System.Threading.Timer(_ => FirebaseAdmin.Messaging.FirebaseMessaging.DefaultInstance.SendAsync(new Message { Topic = "news" }), null, 0, 86_400_000));
        _timers.Add(new System.Threading.Timer(_ => fcm.SendAsync(new Message { Topic = "weekly" }), null, 0, 86_400_000));
        _timers.Add(new System.Threading.Timer(_ => smtpClient.Send(new System.Net.Mail.MailMessage("shop@example.com", "list@example.com", "Weekly", "News")), null, 0, 86_400_000));
        Timer digest = new(_ => SendWeeklyDigest(), null, 0, 604_800_000);
        _timers.Add(digest);
        manager.AddOrUpdate<IDigestSender>("digest", sender => sender.SendDigestAsync(), Cron.Weekly);
    }

    private void SendWeeklyDigest() => smtpClient.Send("shop@example.com", "list@example.com", "Weekly", "News");
}

public class NewsletterJob(INewsletterSender sender) : IJob
{
    public Task Execute(IJobExecutionContext context) => sender.SendNewsletterAsync(context.CancellationToken);
}
