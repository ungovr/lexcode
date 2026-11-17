// lexcode-expect: 0
// Telemetry that follows no visitor or device: Application Insights given only the service's own
// name, a per-visit session id and a correlation id, an event with no user id, server metrics and
// traces kept as anonymous totals, the same Context.User.Id chain on the app's own queue message
// (also in a class whose second and third bases are the app's own initializer interfaces), an
// initializer listed after a base class that sets only a session id, and the app's own Analytics
// class (a report builder), which shares Segment's short name.
using System.Diagnostics.Metrics;
using Microsoft.ApplicationInsights;
using Microsoft.ApplicationInsights.Channel;
using Microsoft.ApplicationInsights.DataContracts;
using Microsoft.ApplicationInsights.Extensibility;

namespace Demo.Reports;

public class RoleNameInitializer : ITelemetryInitializer
{
    public void Initialize(ITelemetry telemetry)
    {
        telemetry.Context.Cloud.RoleName = "orders-api";
        // A per-visit session id (the definition's exclusion) and the request's correlation id
        // identify no returning visitor or device.
        telemetry.Context.Session.Id = Guid.NewGuid().ToString();
        telemetry.Context.Operation.Id = System.Diagnostics.Activity.Current?.TraceId.ToString();
    }
}

public class Jobs(TelemetryClient telemetry)
{
    private static readonly Meter OrdersMeter = new("Demo.Orders");
    private static readonly Counter<long> Placed = OrdersMeter.CreateCounter<long>("orders.placed");

    public void Finished(int count)
    {
        telemetry.TrackMetric("nightly-export-rows", count);
        Placed.Add(count);
    }

    public static void Configure(WebApplicationBuilder builder) =>
        builder.Services.AddOpenTelemetry().WithTracing(t => t.AddAspNetCoreInstrumentation());
}

// The app's own queue message: who placed the order travels with it to the fulfilment worker.
public class OrderMessage
{
    public MessageContext Context { get; } = new();
}

public class MessageContext
{
    public MessageUser User { get; } = new();
}

public class MessageUser
{
    public string? Id { get; set; }
}

public class OrderPublisher
{
    public OrderMessage Envelope(string customerId)
    {
        var message = new OrderMessage();
        message.Context.User.Id = customerId;
        return message;
    }
}

// An initializer listed after a base class, keeping only the per-visit session id.
public class SessionInitializer(Settings settings) : InitializerBase(settings), IDisposable, ITelemetryInitializer
{
    public void Initialize(ITelemetry telemetry)
    {
        var request = telemetry as RequestTelemetry;
        if (request != null) request.Context.Session.Id = Guid.NewGuid().ToString();
    }

    public void Dispose() { }
}

// The app's own initializer interfaces, listed second and third: the message still carries the
// customer to the fulfilment worker, not to an analytics service.
public class OrderEnvelopeInitializer : EnvelopeBase, IOrderInitializer, IMessageInitializer
{
    public void Initialize(object envelope)
    {
        var message = envelope as OrderMessage;
        if (message != null) message.Context.User.Id = "customer";
    }
}

// The app's own class of the same short name: builds the monthly sales report.
public static class Analytics
{
    public static void Initialize(string reportName) { }

    public static ReportClient Client { get; } = new();
}

public class ReportClient
{
    public void Track(string metric, string period) { }
}

public class MonthlyReport
{
    public void Build()
    {
        Analytics.Initialize("sales");
        Analytics.Client.Track("revenue", "2026-10");
    }
}
