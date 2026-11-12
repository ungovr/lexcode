// lexcode-expect: 5
// Cookies whose names mark them as analytics, advertising or visitor-identifier cookies: set on an
// ASP.NET Core response, built as System.Net cookies (constructed and target-typed), and built
// as an ASP.NET (System.Web) cookie through an alias.
using System.Net;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Legacy = System.Web;

namespace Demo.Web;

public class VisitorMiddleware(RequestDelegate next)
{
    public async Task Invoke(HttpContext context)
    {
        if (!context.Request.Cookies.ContainsKey("visitor_id"))
        {
            context.Response.Cookies.Append("visitor_id", Guid.NewGuid().ToString(), new CookieOptions { MaxAge = TimeSpan.FromDays(365) });
        }

        await next(context);
    }
}

public class AdsController : Controller
{
    public IActionResult Click(string fbclid)
    {
        Response.Cookies.Append("_fbc", $"fb.1.{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}.{fbclid}");
        return Ok();
    }
}

public class TrackingClient
{
    public CookieContainer Jar()
    {
        var jar = new CookieContainer();
        jar.Add(new Cookie("_ga", "GA1.1.123.456", "/", "example.org"));
        Cookie device = new("device_id", Guid.NewGuid().ToString());
        jar.Add(device);
        return jar;
    }
}

public class LegacyTracking
{
    public void Set(Legacy.HttpResponse response) =>
        response.Cookies.Add(new Legacy.HttpCookie("tracking_id", Guid.NewGuid().ToString()));
}
