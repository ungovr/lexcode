// lexcode-expect: 0
using HtmlAgilityPack;
using Shop.Cms;

namespace Shop.Content;

// The app's own WebClient, in its CMS namespace, reads stored pages from the app's database by
// their address; System.Net is not imported, so it is not System.Net.WebClient. Parsing what it
// returns is not downloading another site's page.
public class StoredPages
{
    public string Title(string pageUrl)
    {
        var doc = new HtmlDocument();
        doc.LoadHtml(new WebClient().DownloadString(pageUrl));
        var html = new WebClient().DownloadString(pageUrl);
        doc.LoadHtml(html);

        return doc.DocumentNode.SelectSingleNode("//h1").InnerText;
    }
}
