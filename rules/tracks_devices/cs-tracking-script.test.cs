// lexcode-expect: 14
// Third-party analytics and advertising tags kept as C# strings and written into the page: a Google
// tag's default setting (its loader and its config call in one verbatim string), a user id set in an
// interpolated string, a Meta Pixel loader and its calls (interpolated, with escaped quotes and on
// window), a Brevo and an Omnisend snippet (verbatim strings with doubled quotes), a raw string
// literal holding a TikTok pixel, and a string builder's pieces holding a Matomo call.
using System.Text;

namespace Demo.Plugins.Tracking;

public class TagSettings
{
    public string GoogleTag { get; set; } = @"<!-- Global site tag (gtag.js) -->
        <script async src='https://www.googletagmanager.com/gtag/js?id={GOOGLEID}'></script>
        <script>
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '{GOOGLEID}');
        </script>";
}

public class TagWriter
{
    public string UserId(int customerId) => $"gtag('set', {{'user_id': '{customerId}'}});";

    public string PixelBase(string pixelId) => $@"
        <script>
          !function (f, b, e, v) {{ /* ... */ }}(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '{pixelId}');
        </script>";

    public string PixelEvent(string name) => "fbq(\"track\", \"" + name + "\");";

    public string PixelOnWindow(string id) => $"window.fbq('trackCustom', 'Signup', {{ id: '{id}' }});";

    public string Brevo(string key) => $@"<script>
        window.sendinblue = {{}};
        var n = document.createElement('script'); n.src = 'https://sibautomation.com/sa.js?key={key}';
        sendinblue.identify('{key}');
      </script>";

    public string Omnisend(string brandId) => @$"<script type=""text/javascript"">
        window.omnisend = window.omnisend || [];
        omnisend.push([""accountID"", ""{brandId}""]);
        !function(){{var e=document.createElement(""script"");e.src=""https://omnisnippet1.com/inshop/launcher-v2.js"";}}();
      </script>";

    public string TikTok(string pixel) => $"""
        <script>
          ttq.load('{pixel}');
        </script>
        """;

    public string Matomo(string siteId)
    {
        var sb = new StringBuilder("<script>");
        sb.AppendLine("var _paq = window._paq = window._paq || [];");
        sb.AppendLine("_paq.push(['trackPageView']);");
        sb.AppendLine($"_paq.push(['setSiteId', '{siteId}']);");
        sb.Append("</script>");
        return sb.ToString();
    }
}
