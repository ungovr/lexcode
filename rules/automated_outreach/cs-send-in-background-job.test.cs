// lexcode-expect: 6
// Sends from work that runs off a request: a hosted BackgroundService (short form and under an alias), a MassTransit
// consumer, a MediatR event handler after another base, an NServiceBus handler, and an Azure Functions Service Bus
// trigger.
using FirebaseAdmin.Messaging;
using MassTransit;
using MediatR;
using Microsoft.AspNetCore.Identity.UI.Services;
using Microsoft.Azure.Functions.Worker;
using NServiceBus;
using Twilio.Rest.Api.V2010.Account;
using Hosting = Microsoft.Extensions.Hosting;

namespace App.Notifications;

public class EmailWorker(System.Threading.Channels.Channel<OutgoingMail> outbox, IEmailSender emailSender) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (await outbox.Reader.WaitToReadAsync(stoppingToken))
        {
            var mail = await outbox.Reader.ReadAsync(stoppingToken);
            await emailSender.SendEmailAsync(mail.To, mail.Subject, mail.Html);
        }
    }
}

public class SmtpWorker(ISmtpQueue queue) : Hosting.BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var smtpClient = new System.Net.Mail.SmtpClient("smtp.example.com");
        var next = await queue.TakeAsync(stoppingToken);
        await smtpClient.SendMailAsync(next);
    }
}

public class ShippedTextConsumer : IConsumer<OrderShipped>
{
    public async Task Consume(ConsumeContext<OrderShipped> context) =>
        await MessageResource.CreateAsync(to: new Twilio.Types.PhoneNumber(context.Message.Phone), from: new Twilio.Types.PhoneNumber("+15550100"), body: "Your order has shipped.");
}

public class StatusChangedHandler(IEmailSender emailSender) : HandlerBase, INotificationHandler<OrderStatusChanged>
{
    public Task Handle(OrderStatusChanged notification, CancellationToken ct) =>
        emailSender.SendEmailAsync(notification.Email, "Order update", notification.Html);
}

public class OrderShippedHandler(IEmailSender emailSender) : IHandleMessages<OrderShipped>
{
    public Task Handle(OrderShipped message, IMessageHandlerContext context) =>
        emailSender.SendEmailAsync(message.Email, "Shipped", "<p>On its way</p>");
}

public class PushFunction
{
    [Function("Push")]
    public async Task Run([ServiceBusTrigger("pushes")] PushRequest request)
    {
        await FirebaseMessaging.DefaultInstance.SendAsync(new Message { Token = request.Token, Notification = new Notification { Title = request.Title } });
    }
}
