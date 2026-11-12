// lexcode-expect: 0
// One message to one person: a confirmation email a person asked for, the same message tried over a list of SMTP hosts
// and over retry attempts, recipients added to one message's Bcc line, and a confirmation per item of one return
// request to the customer who sent it. A SignalR notification pushed to each user's open page is an in-app message,
// not an email, text, call or direct message. A loop that publishes to a message bus or a
// Service Bus queue sends no one a message. The app's own MessageResource (a translation table in the app's namespace)
// is not Twilio's.
using Microsoft.AspNetCore.Identity.UI.Services;
using App.Localization;

namespace App.Accounts;

public class AccountMail(IEmailSender emailSender, IBus bus, Azure.Messaging.ServiceBus.ServiceBusSender queue)
{
    public async Task ConfirmAsync(string email, string link)
    {
        await emailSender.SendEmailAsync(email, "Confirm your email", $"<a href='{link}'>Confirm</a>");
    }

    public async Task FailoverAsync(System.Net.Mail.MailMessage message, IEnumerable<string> smtpHosts)
    {
        foreach (var host in smtpHosts)
        {
            using var smtp = new System.Net.Mail.SmtpClient(host);
            await smtp.SendMailAsync(message);
            return;
        }
    }

    public async Task RetryAsync(string email)
    {
        for (var attempt = 0; attempt < 3; attempt++)
        {
            await emailSender.SendEmailAsync(email, "Your receipt", "Thanks for your order.");
        }
    }

    public async Task GroupAsync(System.Net.Mail.MailMessage message, IEnumerable<string> watchers, System.Net.Mail.SmtpClient smtpClient)
    {
        foreach (var watcher in watchers)
        {
            message.Bcc.Add(watcher);
        }
        await smtpClient.SendMailAsync(message);
    }

    public async Task PushToScreensAsync(
        IEnumerable<AppUser> users,
        Microsoft.AspNetCore.SignalR.IHubContext<NotifyHub, INotifyClient> hub,
        Microsoft.AspNetCore.SignalR.IHubContext<NotifyHub> dyn)
    {
        foreach (var user in users)
        {
            await hub.Clients.User(user.Id).SendNotification("Your export is ready");
            await dyn.Clients.User(user.Id).SendAsync("ReceiveNotification", "ready");
        }
    }

    public async Task ReturnRequestAsync(Order order, IEnumerable<OrderItem> orderItems)
    {
        foreach (var orderItem in orderItems)
        {
            await emailSender.SendEmailAsync(order.Email, "We received your return", $"Return requested for {orderItem.Name}");
        }
    }

    public async Task PublishAsync(IEnumerable<Order> orders)
    {
        foreach (var order in orders)
        {
            await bus.Publish(new OrderShipped(order.Id));
            await queue.SendMessageAsync(new Azure.Messaging.ServiceBus.ServiceBusMessage(order.Id.ToString()));
            MessageResource.Create(order.Locale, "shipped");
        }
    }
}
