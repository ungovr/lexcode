// lexcode-expect: 23
// One tag per line, each kept as a C# string the app writes into its pages: the loader address of
// every vendor the rule reads, and each tracking call, so every arm of the rule has a line; and a
// tag written into a page as the second argument of Replace.
namespace Demo.Plugins.Tracking;

public class VendorTags
{
    public string[] Lines()
    {
        var page = new System.Collections.Generic.List<string>();
        page.Add("<script async src='https://www.googletagmanager.com/gtm.js?id=GTM-X'></script>");
        page.Add("<script src='https://analytics.tiktok.com/i18n/pixel/events.js'></script>");
        page.Add("<script src='https://s.pinimg.com/ct/core.js'></script>");
        page.Add("<script src='https://sc-static.net/scevent.min.js'></script>");
        page.Add("<script src='https://static.ads-twitter.com/uwt.js'></script>");
        page.Add("<script src='https://snap.licdn.com/li.lms-analytics/insight.min.js'></script>");
        page.Add("<script src='//js.hs-scripts.com/123.js'></script>");
        page.Add("<script src='https://static.klaviyo.com/onsite/js/klaviyo.js?company_id=X'></script>");
        page.Add("<script src='https://static.hotjar.com/c/hotjar-1.js?sv=6'></script>");
        page.Add("<script src='https://cdn.segment.com/analytics.js/v1/KEY/analytics.min.js'></script>");
        page.Add("<script>pintrk('load', '2612');</script>");
        page.Add("<script>snaptr('init', 'abc');</script>");
        page.Add("<script>twq('config', 'o1');</script>");
        page.Add("<script>lintrk('track', { conversion_id: 1 });</script>");
        page.Add("<script>_hsq.push(['setPath', '/']);</script>");
        page.Add("<script>_learnq.push(['identify', {}]);</script>");
        page.Add("<script>posthog.init('phc_key');</script>");
        page.Add("<script>mixpanel.track('Signup');</script>");
        page.Add("<script>amplitude.init('key');</script>");
        page.Add("<script>heap.identify('u');</script>");
        page.Add("<script>ttq.page();</script>");
        page.Add("<script>sendinblue.track('cart');</script>");
        page.Add(page[0].Replace("</head>", "<script src='https://www.googletagmanager.com/gtag/js?id=G-1'></script></head>"));
        return page.ToArray();
    }
}
