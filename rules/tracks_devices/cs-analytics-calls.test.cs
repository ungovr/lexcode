// lexcode-expect: 22
// Visits and events sent to third-party analytics services that follow the visitor or device
// with their own id: Application Insights given a user or device id (on the telemetry an
// initializer or processor sees, a request telemetry reached with `as`, an event telemetry, and a
// client's own context), Segment (Analytics.NET, and Analytics-CSharp through an alias), Mixpanel
// and PostHog (injected, constructed and target-typed), Firebase Analytics on .NET MAUI, and the
// Google Analytics Measurement Protocol.
using Microsoft.ApplicationInsights;
using Microsoft.ApplicationInsights.Channel;
using Microsoft.ApplicationInsights.DataContracts;
using Microsoft.ApplicationInsights.Extensibility;
using Mixpanel;
using PostHog;
using Segment;
using Fb = Plugin.Firebase.Analytics;
using SegmentCs = Segment.Analytics;

namespace Demo.Telemetry;

public class UserTelemetryInitializer(IHttpContextAccessor accessor) : ITelemetryInitializer
{
    public void Initialize(ITelemetry telemetry)
    {
        telemetry.Context.User.AuthenticatedUserId = accessor.HttpContext?.User.Identity?.Name;
        telemetry.Context.Device.Id = accessor.HttpContext?.Request.Headers["X-Device-Id"];
    }
}

public class RequestUserInitializer(IHttpContextAccessor accessor) : ITelemetryInitializer
{
    public void Initialize(ITelemetry telemetry)
    {
        var requestTelemetry = telemetry as RequestTelemetry;
        if (requestTelemetry == null) return;
        requestTelemetry.Context.User.AuthenticatedUserId = accessor.HttpContext?.User.Identity?.Name;
    }
}

public class PageViewUserProcessor(ITelemetryProcessor next, IHttpContextAccessor accessor) : ITelemetryProcessor
{
    public void Process(ITelemetry item)
    {
        if (item is PageViewTelemetry pageView)
        {
            pageView.Context.User.Id = accessor.HttpContext?.Request.Cookies["visitor"];
        }

        next.Process(item);
    }
}

public class DeviceEvents
{
    public void Tag(EventTelemetry evt, string deviceId) => evt.Context.Device.Id = deviceId;
}

public class SignedInTelemetry(TelemetryClient client)
{
    public void Attach(string userId) => client.Context.User.AuthenticatedUserId = userId;
}

public class Events(IMixpanelClient mixpanel, IPostHogClient posthog)
{
    public void Start() => Analytics.Initialize("write-key");

    public void Signed(string userId) => Analytics.Client.Track(userId, "Signed Up");

    public Task<bool> Bought(string distinctId) => mixpanel.TrackAsync("Purchase", distinctId, new { Total = 12 });

    public void Viewed(string distinctId) => posthog.Capture(distinctId, "page viewed");

    public MixpanelClient Make() => new MixpanelClient("token");

    public void Local()
    {
        MixpanelClient client = new("token");
        client.Track("Opened", "anon");
    }
}

public class Clients
{
    public PostHogClient MakePostHog(PostHogOptions options) => new PostHogClient(options);

    public void LocalPostHog(PostHogOptions options)
    {
        PostHogClient client = new(options);
    }

    public SegmentCs.Analytics MakeSegment(SegmentCs.Configuration config) => new SegmentCs.Analytics(config);

    public void LocalSegment(SegmentCs.Configuration config)
    {
        SegmentCs.Analytics analytics = new(config);
        analytics.Track("Opened");
    }
}

public static class Setup
{
    public static void Configure(WebApplicationBuilder builder) => builder.AddPostHog();
}

public class MobileEvents
{
    public void Opened() => Fb.CrossFirebaseAnalytics.Current.LogEvent("app_open");

    public void Who(string id) => Fb.CrossFirebaseAnalytics.Current.SetUserId(id);
}

public class ServerSide
{
    private const string Endpoint = "https://www.google-analytics.com/mp/collect";
}
