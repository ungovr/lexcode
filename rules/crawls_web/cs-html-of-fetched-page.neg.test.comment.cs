// lexcode-expect: 0
//using AngleSharp;
using Shop.Content.Html;

namespace Shop.Content;

// The app's own IBrowsingContext. AngleSharp is only mentioned: in prose (we may add using
// AngleSharp later), in the commented-out line above, in block comments (lines that open with `*`
// and lines that do not), and in comments after code on a line.
/*
 * using AngleSharp.Html.Parser;
 */
/* The old renderer, kept for reference:
using AngleSharp;
   var context = AngleSharp.BrowsingContext.New(AngleSharp.Configuration.Default);
*/
public class OwnRenderer(IBrowsingContext context)
{
    private readonly string _engine = "own"; // was AngleSharp.Html.Parser.HtmlParser
    private readonly int _depth = 2; /* AngleSharp.Dom kept the same depth */

    public async Task RenderAsync(string pageUrl)
    {
        var opened = await context.OpenAsync(pageUrl);
    }
}

/* The old reader, with a quote, an apostrophe, a raw string and a line comment inside:
using AngleSharp; var accept = """text/html"""; it's "quoted" // kept for reference
*/
public class OldReader(IBrowsingContext context)
{
    public Task OpenAsync(string pageUrl) => context.OpenAsync(pageUrl);
}
