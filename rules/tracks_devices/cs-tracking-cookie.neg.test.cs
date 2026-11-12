// lexcode-expect: 0
// Cookies that do not follow a device: a language preference and a sign-in session cookie, a
// tracking cookie being removed on a consent change (deleted, written empty, or expired with no
// value), the app's own outbound HTTP client replaying cookies from its jar (System.Net, which
// sets nothing on a visitor's device), and the app's own Cookie class (a recipe), which shares
// System.Net's short name.
using Microsoft.AspNetCore.Http;

namespace Demo.Kitchen;

public class PreferencesMiddleware(RequestDelegate next)
{
    public async Task Invoke(HttpContext context)
    {
        context.Response.Cookies.Append("lang", "en-US", new CookieOptions { IsEssential = true });
        context.Response.Cookies.Append(".AspNetCore.Session", "abc", new CookieOptions { HttpOnly = true });

        // Consent withdrawn: the analytics cookies are removed, not set.
        context.Response.Cookies.Delete("_ga");
        context.Response.Cookies.Append("_gid", "", new CookieOptions { Expires = DateTimeOffset.UnixEpoch });
        context.Response.Cookies.Append("visitor_id", string.Empty);

        await next(context);
    }

    // ASP.NET (System.Web): the classic removal, a cookie of the same name already expired and
    // given no value.
    public void Withdraw(System.Web.HttpResponse response) =>
        response.Cookies.Add(new System.Web.HttpCookie("_ga") { Expires = DateTime.UtcNow.AddDays(-1) });
}

// An outbound HTTP client's cookie jar: these cookies go from this server to another site, and
// nothing is written to a visitor's browser or device.
public class PriceFeedClient
{
    public System.Net.CookieContainer Jar()
    {
        var jar = new System.Net.CookieContainer();
        jar.Add(new System.Net.Cookie("_ga", "GA1.1.123.456", "/", "example.org"));
        System.Net.Cookie device = new("device_id", Guid.NewGuid().ToString());
        jar.Add(device);
        return jar;
    }
}

// The app's own class of the same short name: a recipe card.
public class Cookie(string name, string flavour)
{
    public string Name { get; } = name;
    public string Flavour { get; } = flavour;
}

public class Bakery
{
    public Cookie Special() => new Cookie("tracking_id", "oat");
}
