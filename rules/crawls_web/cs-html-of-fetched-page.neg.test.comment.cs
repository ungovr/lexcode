// lexcode-expect: 0
//using AngleSharp;
using Shop.Content.Html;

namespace Shop.Content;

// The app's own IBrowsingContext. AngleSharp is only mentioned: in prose (we may add using
// AngleSharp later), in the commented-out line above, and in a block comment.
/*
 * using AngleSharp.Html.Parser;
 */
public class OwnRenderer(IBrowsingContext context)
{
    public async Task RenderAsync(string pageUrl)
    {
        var opened = await context.OpenAsync(pageUrl);
    }
}
