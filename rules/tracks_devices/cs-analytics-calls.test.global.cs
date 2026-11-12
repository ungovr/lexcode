// lexcode-expect: 5
// The vendor types arrive through a global using in another file (a GlobalUsings.cs), so this
// file has no using at all: only the vendor-named short forms (MixpanelClient, PostHogClient,
// CrossFirebaseAnalytics), constructed and target-typed, can match here.
namespace Demo.Telemetry;

public class Clients
{
    public MixpanelClient MakeMixpanel() => new MixpanelClient("token");

    public void LocalMixpanel()
    {
        MixpanelClient client = new("token");
    }

    public PostHogClient MakePostHog(PostHogOptions options) => new PostHogClient(options);

    public void LocalPostHog(PostHogOptions options)
    {
        PostHogClient client = new(options);
    }

    public void Opened() => CrossFirebaseAnalytics.Current.LogEvent("app_open");
}
