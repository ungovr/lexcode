// lexcode-expect: 6
// Cookies whose names mark them as analytics, advertising or visitor-identifier cookies: set on an
// ASP.NET Core response, and built as an ASP.NET (System.Web) response cookie, through a using
// (target-typed) and through an alias (constructed, and with an object initializer that sets the
// value or the lifetime).
using System.Web;
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

public class LegacyVisitor
{
    public void Remember(System.Web.HttpResponse response)
    {
        HttpCookie visitor = new("anonymous_id", Guid.NewGuid().ToString());
        response.Cookies.Add(visitor);
    }
}

public class LegacyTracking
{
    public void Set(Legacy.HttpResponse response) =>
        response.Cookies.Add(new Legacy.HttpCookie("tracking_id", Guid.NewGuid().ToString()));

    public void Analytics(Legacy.HttpResponse response, string clientId)
    {
        response.Cookies.Add(new Legacy.HttpCookie("_ga") { Value = clientId, Expires = DateTime.UtcNow.AddYears(2) });
        response.Cookies.Add(new Legacy.HttpCookie("_gid", clientId) { HttpOnly = false });
    }
}
