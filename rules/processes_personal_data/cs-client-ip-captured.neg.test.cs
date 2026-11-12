// lexcode-expect: 0
// The visitor's address read but not kept: an allow-list check whose answer is logged, a loopback
// test, an address echoed back or shown on a page (with an unrelated list insert after it), a log
// line without the address, and the app's own Log class (a math helper), which shares Serilog's
// short name.
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace Demo.Diagnostics;

public class DiagnosticsController(ILogger<DiagnosticsController> logger) : Controller
{
    private static readonly string[] LocalAddresses = ["127.0.0.1", "::1"];

    public IActionResult Index()
    {
        var remote = HttpContext.Connection.RemoteIpAddress;
        var allowed = LocalAddresses.Contains(remote?.ToString());
        logger.LogWarning("Diagnostics requested; allowed: {Allowed}", allowed);
        if (!IsAllowedNetwork(remote?.ToString()))
        {
            logger.LogWarning("Diagnostics refused for a remote caller");
            return NotFound();
        }

        return Ok(new { Address = remote?.ToString() });
    }

    // Shown back on the page and discarded: no write follows.
    public IActionResult Whoami()
    {
        var view = new VisitView();
        view.IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
        var items = new List<string> { "home" };
        items.Insert(0, "whoami");
        view.Breadcrumbs = items;
        return View(view);
    }

    public bool Local() => System.Net.IPAddress.IsLoopback(HttpContext.Connection.RemoteIpAddress!);

    private static bool IsAllowedNetwork(string? address) => address is "127.0.0.1";

    public void Build()
    {
        var host = Request.Headers["X-Forwarded-For"].ToString();
        logger.LogInformation(host.Length > 0 ? "Proxied request" : "Direct request");
        var bits = Log.Information(host);
    }
}

public class VisitView
{
    public string? IpAddress { get; set; }
    public List<string> Breadcrumbs { get; set; } = [];
}

// The app's own class of the same short name as Serilog's static logger: a math helper giving
// the Shannon information of a string, in bits. It keeps nothing.
public static class Log
{
    public static double Information(string text) => text.Length * System.Math.Log2(256);
}
