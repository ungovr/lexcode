// lexcode-expect: 0
// No third-party tag in a C# string: a comment that names the Google tag and Pixel calls, a
// Content-Security-Policy that lists the tag hosts with no loader path, a consent-mode default
// with no config call, the app's own tracker object (`orderTracker.track(...)`, `app.gtag(...)`)
// in a script string, and a log line that names the Pixel's call without quotes.
using Microsoft.Extensions.Logging;

namespace Demo.Web.Security;

public class Headers(ILogger<Headers> logger)
{
    // Before the move to server-side events this page called gtag('config', id) and
    // fbq('track', 'PageView') and loaded https://www.googletagmanager.com/gtag/js directly.
    public string Csp() =>
        "script-src 'self' https://www.googletagmanager.com https://connect.facebook.net; " +
        "connect-src 'self' https://www.google-analytics.com";

    public string ConsentDefault() =>
        "<script>gtag('consent', 'default', { ad_storage: 'denied', analytics_storage: 'denied' });</script>";

    public string OrderScript(string orderId) => $@"<script>
        orderTracker.track('{orderId}');
        app.gtag('config');
        shipping.posthog.capture('label');
      </script>";

    public void Note() => logger.LogInformation("Pixel calls (fbq track) are now sent from the server");
}
