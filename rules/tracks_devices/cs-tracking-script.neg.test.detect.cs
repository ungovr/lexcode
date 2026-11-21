// lexcode-expect: 0
// A tag's loader address or call held in a string only to look for it or to block it, never written
// into a page: a test for an installed Google Tag Manager, a search for a loader, a tag stripped out
// of a page (the first argument of Replace), a regular expression, and an ad blocker's list (an
// array, a list and a set, built with an initializer or a collection expression).
using System.Text.RegularExpressions;

namespace Demo.Health;

public class TagChecks
{
    public bool HasGtm(string html) => html.Contains("https://www.googletagmanager.com/gtm.js");

    public int Where(string html) => html.IndexOf("googletagmanager.com/gtm.js", StringComparison.Ordinal);

    public bool StartsWithLoader(string src) => src.StartsWith("https://connect.facebook.net/en_US/fbevents.js") || src.EndsWith("static.hotjar.com/c/hotjar-");

    public bool Same(string src) => string.Equals(src, "https://cdn.segment.com/analytics.js", StringComparison.OrdinalIgnoreCase);

    public string Strip(string html) => html.Replace("<script src=\"https://snap.licdn.com/li.lms-analytics/insight.min.js\"></script>", "");

    public bool Matches(string html) => Regex.IsMatch(html, "googletagmanager.com/gtag/js");

    private static readonly Regex Hotjar = new Regex("static.hotjar.com/c/hotjar-\\d+");
}

public class BlockList
{
    public string[] Blocked = { "connect.facebook.net/en_US/fbevents.js", "googletagmanager.com/gtm.js?id=GTM" };

    public static readonly string[] Loaders = new[] { "static.ads-twitter.com/uwt.js", "s.pinimg.com/ct/core.js" };

    public static readonly string[] Pixels = new string[] { "analytics.tiktok.com/i18n/pixel/", "omnisnippet1.com/inshop/" };

    public List<string> More { get; } = new List<string> { "sc-static.net/scevent.min.js", "js.hs-scripts.com/" };

    public HashSet<string> Hosts { get; } = new() { "analytics.tiktok.com/i18n/pixel/", "static.klaviyo.com/onsite/js/" };

    public string[] Latest { get; } = ["cdn.segment.com/analytics.js", "static.hotjar.com/c/hotjar-"];
}
