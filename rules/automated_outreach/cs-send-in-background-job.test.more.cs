// lexcode-expect: 10
// More work that runs off a request: a MassTransit consumer and an NServiceBus handler after another base, a MediatR
// handler with no other base, Azure Functions queue triggers (isolated and in-process) and an in-process Service Bus
// trigger, and Hangfire jobs scheduled generically and through the injected client. The sends are the rest of the
// send set: Twilio texts and calls, an injected Firebase client, and the app's own send method.
using FirebaseAdmin.Messaging;
using Hangfire;
using MassTransit;
using MediatR;
using Microsoft.Azure.Functions.Worker;
using NServiceBus;
using Twilio.Rest.Api.V2010.Account;
using Twilio.Types;

namespace App.Notifications;

public class CallConsumer : ConsumerBase, IConsumer<OrderDelayed>
{
    public async Task Consume(ConsumeContext<OrderDelayed> context) =>
        await CallResource.CreateAsync(to: new PhoneNumber(context.Message.Phone), from: new PhoneNumber("+15550100"), url: new Uri("https://example.com/delay.xml"));
}

public class WelcomeHandler(FirebaseMessaging messaging) : INotificationHandler<UserRegistered>
{
    public Task Handle(UserRegistered notification, CancellationToken ct) =>
        messaging.SendAsync(new Message { Token = notification.DeviceToken, Notification = new Notification { Title = "Welcome" } });
}

public class DelayHandler : HandlerBase, IHandleMessages<OrderDelayed>
{
    public Task Handle(OrderDelayed message, IMessageHandlerContext context)
    {
        CallResource.Create(to: new PhoneNumber(message.Phone), from: new PhoneNumber("+15550100"), url: new Uri("https://example.com/delay.xml"));
        return Task.CompletedTask;
    }
}

public class QueueFunctions
{
    [Function("Texts")]
    public void Texts([QueueTrigger("texts")] TextRequest request)
    {
        MessageResource.Create(to: new PhoneNumber(request.Phone), from: new PhoneNumber("+15550100"), body: request.Body);
    }

    [Microsoft.Azure.WebJobs.FunctionName("Mail")]
    public static void Mail([Microsoft.Azure.WebJobs.QueueTrigger("mail")] string email)
    {
        SendWelcomeEmail(email);
    }

    [Microsoft.Azure.WebJobs.FunctionName("Bus")]
    public static void Bus([Microsoft.Azure.WebJobs.ServiceBusTrigger("bus")] string email)
    {
        SendWelcomeEmail(email);
    }

    private static void SendWelcomeEmail(string email) => Console.WriteLine(email);
}

public class Followups(IBackgroundJobClient jobs)
{
    public void Schedule(string email)
    {
        BackgroundJob.Schedule<IMailer>(m => m.SendReminderAsync(email), TimeSpan.FromDays(1));
        jobs.Enqueue(() => Mailer.SendWelcomeEmail(email));
        jobs.Enqueue<IMailer>(m => m.SendWelcomeEmailAsync(email));
        jobs.Schedule<IMailer>(m => m.SendReminderAsync(email), TimeSpan.FromDays(3));
    }
}
