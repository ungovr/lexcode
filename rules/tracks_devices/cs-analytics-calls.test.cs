// lexcode-expect: 13
// Visits and events sent to third-party analytics services that follow the visitor or device
// with their own id: Application Insights given a user or device id, Segment, Mixpanel (injected,
// constructed and target-typed), PostHog, Firebase Analytics on .NET MAUI, and the Google
// Analytics Measurement Protocol.
using Microsoft.ApplicationInsights.Channel;
using Microsoft.ApplicationInsights.Extensibility;
using Mixpanel;
using PostHog;
using Segment;
using Fb = Plugin.Firebase.Analytics;

namespace Demo.Telemetry;

public class UserTelemetryInitializer(IHttpContextAccessor accessor) : ITelemetryInitializer
{
    public void Initialize(ITelemetry telemetry)
    {
        telemetry.Context.User.AuthenticatedUserId = accessor.HttpContext?.User.Identity?.Name;
        telemetry.Context.Device.Id = accessor.HttpContext?.Request.Headers["X-Device-Id"];
    }
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
