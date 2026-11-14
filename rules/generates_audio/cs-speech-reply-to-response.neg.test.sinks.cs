// lexcode-expect: 0
// What the sinks leave out, each reached with the rule's own source; removing the guard named in a
// case's comment makes that case match.
using OpenAI.Audio;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace Demo.SinkGuards;

// The controller name regex: a class with a base that is not named like a controller is not one.
public class ReplyCache : CacheBase
{
    public async Task<object> Get(AudioClient voice)
    {
        return (await voice.GenerateSpeechAsync("q", GeneratedSpeechVoice.Alloy)).Value;
    }
}

public class LoggingController : ControllerBase
{
    // The expression-body regex ^[^{]: a block body that only logs is not an expression body.
    public async Task<IActionResult> Logged(AudioClient voice)
    {
        var output = (await voice.GenerateSpeechAsync("q", GeneratedSpeechVoice.Alloy)).Value;
        System.Diagnostics.Debug.WriteLine(output);
        return Ok();
    }

    // The return-type regex: a one-statement void action reads as an expression body.
    public async Task Audited(AudioClient voice) { System.Diagnostics.Debug.WriteLine((await voice.GenerateSpeechAsync("q", GeneratedSpeechVoice.Alloy)).Value); }

    // The Response method regex: a redirect to the page the model picked shows that page, not
    // what the model wrote.
    public async Task<IActionResult> Redirected(AudioClient voice)
    {
        var output = (await voice.GenerateSpeechAsync("q", GeneratedSpeechVoice.Alloy)).Value;
        Response.Redirect("/products/" + output);
        return new EmptyResult();
    }
}

public static class Jobs
{
    public static void Register(WebApplication app, IJobScheduler jobs)
    {
        // A block handler that only logs returns nothing made.
        app.MapPost("/log", async (AudioClient voice) =>
        {
            var output = (await voice.GenerateSpeechAsync("q", GeneratedSpeechVoice.Alloy)).Value;
            System.Diagnostics.Debug.WriteLine(output);
            return Results.NoContent();
        });

        // The Map method regex: a job scheduled by name is not a route handler.
        jobs.Schedule("nightly", async (AudioClient voice) => (await voice.GenerateSpeechAsync("q", GeneratedSpeechVoice.Alloy)).Value);
    }

    // The Results helper regex: a redirect to the page the model picked shows that page, not what
    // the model wrote.
    public static async Task<IResult> Redirected(AudioClient voice)
    {
        var output = (await voice.GenerateSpeechAsync("q", GeneratedSpeechVoice.Alloy)).Value;
        return Results.LocalRedirect("/products/" + output);
    }
}

// The page property regex: a page model's local is not rendered.
public class DraftModel : PageModel
{
    public async Task OnPostAsync(AudioClient voice)
    {
        object draft;
        draft = (await voice.GenerateSpeechAsync("q", GeneratedSpeechVoice.Alloy)).Value;
        System.Diagnostics.Debug.WriteLine(draft);
    }
}
