// lexcode-expect: 0
// Cookies that do not follow a device: a language preference and a sign-in session cookie, a
// tracking cookie being removed on a consent change (deleted, or written empty), and the app's
// own Cookie class (a recipe), which shares System.Net's short name.
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
