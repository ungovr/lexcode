// lexcode-expect: 0
// What the sinks leave out, each reached with the rule's own source; removing the guard named in a
// case's comment makes that case match. Generated with the rule's sinks (#13012 fix round 1).
using Mscc.GenerativeAI;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace Demo.SinkGuards;

// The controller name regex: a class with a base that is not named like a controller is not one.
public class ReplyCache : CacheBase
{
    public async Task<object> Get(GoogleAI googleAI)
    {
        return (await googleAI.GenerativeModel("gemini-2.5-flash").GenerateContent("q")).Text;
    }
}

public class LoggingController : ControllerBase
{
    // The expression-body regex ^[^{]: a block body that only logs is not an expression body.
    public async Task<IActionResult> Logged(GoogleAI googleAI)
    {
        var output = (await googleAI.GenerativeModel("gemini-2.5-flash").GenerateContent("q")).Text;
        System.Diagnostics.Debug.WriteLine(output);
        return Ok();
    }

    // The return-type regex: a one-statement void action reads as an expression body.
    public async Task Audited(GoogleAI googleAI) { System.Diagnostics.Debug.WriteLine((await googleAI.GenerativeModel("gemini-2.5-flash").GenerateContent("q")).Text); }

    // The Response method regex: a redirect to the page the model picked shows that page, not
    // what the model wrote.
    public async Task<IActionResult> Redirected(GoogleAI googleAI)
    {
        var output = (await googleAI.GenerativeModel("gemini-2.5-flash").GenerateContent("q")).Text;
        Response.Redirect("/products/" + output);
        return new EmptyResult();
    }
}

public static class Jobs
{
    public static void Register(WebApplication app, IJobScheduler jobs)
    {
        // A block handler that only logs returns nothing made.
        app.MapPost("/log", async (GoogleAI googleAI) =>
        {
            var output = (await googleAI.GenerativeModel("gemini-2.5-flash").GenerateContent("q")).Text;
            System.Diagnostics.Debug.WriteLine(output);
            return Results.NoContent();
        });

        // The Map method regex: a job scheduled by name is not a route handler.
        jobs.Schedule("nightly", async (GoogleAI googleAI) => (await googleAI.GenerativeModel("gemini-2.5-flash").GenerateContent("q")).Text);
    }

    // The Results helper regex: a redirect to the page the model picked shows that page, not what
    // the model wrote.
    public static async Task<IResult> Redirected(GoogleAI googleAI)
    {
        var output = (await googleAI.GenerativeModel("gemini-2.5-flash").GenerateContent("q")).Text;
        return Results.LocalRedirect("/products/" + output);
    }
}

// The page property regex: a page model's local is not rendered.
public class DraftModel : PageModel
{
    public async Task OnPostAsync(GoogleAI googleAI)
    {
        object draft;
        draft = (await googleAI.GenerativeModel("gemini-2.5-flash").GenerateContent("q")).Text;
        System.Diagnostics.Debug.WriteLine(draft);
    }
}
