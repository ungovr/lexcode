// lexcode-expect: 9
// One send per recipient in a loop: ASP.NET Core Identity's injected IEmailSender, System.Net.Mail's and MailKit's SMTP
// clients, Twilio texts and calls (under the import and an alias), Firebase pushes (the default instance and an
// injected one), and a SendGrid send, in foreach (braced, braceless, typed), await foreach, for, List.ForEach and
// Parallel.ForEachAsync loops.
using FirebaseAdmin.Messaging;
using Microsoft.AspNetCore.Identity.UI.Services;
using SendGrid;
using Twilio.Rest.Api.V2010.Account;
using Twilio.Types;
using Tw = Twilio.Rest.Api.V2010.Account;

namespace App.Campaigns;

public class Broadcaster(IEmailSender emailSender, ISendGridClient sendGrid)
{
    private readonly FirebaseMessaging _messaging = FirebaseMessaging.DefaultInstance;

    public async Task NewsletterAsync(IEnumerable<Subscriber> subscribers, string html)
    {
        foreach (var subscriber in subscribers)
        {
            await emailSender.SendEmailAsync(subscriber.Email, "This month", html);
        }
    }

    public async Task SmtpAsync(IEnumerable<System.Net.Mail.MailMessage> messages)
    {
        using var smtp = new System.Net.Mail.SmtpClient("smtp.example.com");
        foreach (System.Net.Mail.MailMessage message in messages)
            await smtp.SendMailAsync(message);
    }

    public async Task MailKitAsync(List<MimeKit.MimeMessage> batch)
    {
        using var smtpClient = new MailKit.Net.Smtp.SmtpClient();
        for (var i = 0; i < batch.Count; i++)
        {
            await smtpClient.SendAsync(batch[i]);
        }
    }

    public void Texts(List<Customer> customers) =>
        customers.ForEach(c => MessageResource.Create(to: new PhoneNumber(c.Phone), from: new PhoneNumber("+15550100"), body: "Our spring sale starts today."));

    public Task AliasTextsAsync(IEnumerable<Customer> customers) =>
        Parallel.ForEachAsync(customers, async (c, ct) => await Tw.MessageResource.CreateAsync(to: new PhoneNumber(c.Phone), from: new PhoneNumber("+15550100"), body: "Reminder: your appointment is tomorrow."));

    public async Task CallsAsync(IEnumerable<Customer> customers)
    {
        foreach (var c in customers)
        {
            await CallResource.CreateAsync(to: new PhoneNumber(c.Phone), from: new PhoneNumber("+15550100"), url: new Uri("https://example.com/voice.xml"));
        }
    }

    public async Task PushAsync(IAsyncEnumerable<Device> devices)
    {
        await foreach (var device in devices)
        {
            await FirebaseMessaging.DefaultInstance.SendAsync(new Message { Token = device.Token, Notification = new Notification { Title = "New arrivals" } });
            await _messaging.SendAsync(new Message { Token = device.Token, Data = new Dictionary<string, string> { ["kind"] = "promo" } });
        }
    }

    public async Task SendGridAsync(IEnumerable<SendGrid.Helpers.Mail.SendGridMessage> messages)
    {
        foreach (var message in messages)
        {
            await sendGrid.SendEmailAsync(message);
        }
    }
}
