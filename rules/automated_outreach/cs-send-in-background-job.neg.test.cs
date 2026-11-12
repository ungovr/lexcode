// lexcode-expect: 0
// Background work that sends no one a message: a hosted worker that resizes images, an event handler that logs, a
// Hangfire cleanup job, and a consumer that publishes an event. A password reset is sent from a request handler a
// person triggered. The app's own IConsumer (a metrics consumer in the app's namespace) is not MassTransit's.
using App.Metrics;
using Hangfire;
using MediatR;
using Microsoft.AspNetCore.Identity.UI.Services;

namespace App.Background;

public class Thumbnailer(IImageQueue queue) : Microsoft.Extensions.Hosting.BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await foreach (var image in queue.ReadAllAsync(stoppingToken))
        {
            await image.ResizeAsync(256);
        }
    }
}

public class LogTodoItemCompleted(ILogger<LogTodoItemCompleted> logger) : INotificationHandler<TodoItemCompletedEvent>
{
    public Task Handle(TodoItemCompletedEvent notification, CancellationToken cancellationToken)
    {
        logger.LogInformation("Todo item completed: {Id}", notification.Item.Id);
        return Task.CompletedTask;
    }
}

public class Cleanup(ISessionStore sessions)
{
    public void Schedule() => BackgroundJob.Enqueue(() => sessions.PurgeExpiredAsync());
}

public class OrderConsumer(IPublisher publisher) : MassTransit.IConsumer<OrderSubmitted>
{
    public Task Consume(MassTransit.ConsumeContext<OrderSubmitted> context) => context.Publish(new OrderAccepted(context.Message.Id));
}

public class ForgotPasswordHandler(IEmailSender emailSender) : IRequestHandler<ForgotPasswordCommand>
{
    public Task Handle(ForgotPasswordCommand request, CancellationToken ct) =>
        emailSender.SendEmailAsync(request.Email, "Reset your password", request.Link);
}

public class MetricsConsumer(IMailer mailer) : IConsumer<Reading>
{
    public Task Consume(Reading reading) => mailer.SendAsync("ops@example.com", reading.ToString());
}
