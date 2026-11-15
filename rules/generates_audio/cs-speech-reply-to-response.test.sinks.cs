// lexcode-expect: 52
// Every sink and propagator branch of the rule, each reached alone, with the rule's own source.
// Microsoft.AspNetCore.Http, System.IO and Microsoft.Maui.Controls are not imported (they are
// implicit), so a short form and its aliased qualified form each have a case of their own.
using OpenAI.Audio;
using System.Text;
using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.AspNetCore.SignalR;
using Http = Microsoft.AspNetCore.Http;
using Mc = Microsoft.Maui.Controls;

namespace Demo.Sinks;

public class ActionsController : ControllerBase
{
    // A controller action's value.
    public async Task<IActionResult> Returned(AudioClient voice)
    {
        var output = (await voice.GenerateSpeechAsync("q", GeneratedSpeechVoice.Alloy)).Value;
        return Ok(output);
    }

    // Streamed with yield return.
    public async IAsyncEnumerable<object> Streamed(AudioClient voice)
    {
        var output = (await voice.GenerateSpeechAsync("q", GeneratedSpeechVoice.Alloy)).Value;
        yield return output;
    }

    // An expression body.
    public async Task<object> Expression(AudioClient voice) => (await voice.GenerateSpeechAsync("q", GeneratedSpeechVoice.Alloy)).Value;

    // The response body, written from the action.
    public async Task Written(AudioClient voice)
    {
        await Response.WriteAsync((await voice.GenerateSpeechAsync("q", GeneratedSpeechVoice.Alloy)).Value);
    }

    public async Task WrittenToBody(AudioClient voice)
    {
        await Response.Body.WriteAsync((await voice.GenerateSpeechAsync("q", GeneratedSpeechVoice.Alloy)).Value);
    }

    public async Task Copied(AudioClient voice)
    {
        var stream = (await voice.GenerateSpeechAsync("q", GeneratedSpeechVoice.Alloy)).Value;
        await stream.CopyToAsync(Response.Body);
    }

    // View data.
    public async Task Bag(AudioClient voice)
    {
        ViewBag.Output = (await voice.GenerateSpeechAsync("q", GeneratedSpeechVoice.Alloy)).Value;
    }

    public async Task Data(AudioClient voice)
    {
        ViewData["output"] = (await voice.GenerateSpeechAsync("q", GeneratedSpeechVoice.Alloy)).Value;
    }

    public async Task Temp(AudioClient voice)
    {
        TempData["output"] = (await voice.GenerateSpeechAsync("q", GeneratedSpeechVoice.Alloy)).Value;
    }

    // Propagators: written to a file, then the file is the response.
    public async Task<IActionResult> BytesQualified(AudioClient voice)
    {
        var path = "/srv/out/1";
        System.IO.File.WriteAllBytes(path, (await voice.GenerateSpeechAsync("q", GeneratedSpeechVoice.Alloy)).Value);
        return PhysicalFile(path, "application/octet-stream");
    }

    public async Task<IActionResult> Bytes(AudioClient voice)
    {
        var path = "/srv/out/2";
        File.WriteAllBytes(path, (await voice.GenerateSpeechAsync("q", GeneratedSpeechVoice.Alloy)).Value);
        return PhysicalFile(path, "application/octet-stream");
    }

    public async Task<IActionResult> BytesAsyncQualified(AudioClient voice)
    {
        var path = "/srv/out/3";
        await System.IO.File.WriteAllBytesAsync(path, (await voice.GenerateSpeechAsync("q", GeneratedSpeechVoice.Alloy)).Value);
        return PhysicalFile(path, "application/octet-stream");
    }

    public async Task<IActionResult> BytesAsync(AudioClient voice)
    {
        var path = "/srv/out/4";
        await File.WriteAllBytesAsync(path, (await voice.GenerateSpeechAsync("q", GeneratedSpeechVoice.Alloy)).Value);
        return PhysicalFile(path, "application/octet-stream");
    }

    public async Task<IActionResult> TextQualified(AudioClient voice)
    {
        var path = "/srv/out/5";
        System.IO.File.WriteAllText(path, (await voice.GenerateSpeechAsync("q", GeneratedSpeechVoice.Alloy)).Value);
        return PhysicalFile(path, "text/plain");
    }

    public async Task<IActionResult> Text(AudioClient voice)
    {
        var path = "/srv/out/6";
        File.WriteAllText(path, (await voice.GenerateSpeechAsync("q", GeneratedSpeechVoice.Alloy)).Value);
        return PhysicalFile(path, "text/plain");
    }

    public async Task<IActionResult> TextAsyncQualified(AudioClient voice)
    {
        var path = "/srv/out/7";
        await System.IO.File.WriteAllTextAsync(path, (await voice.GenerateSpeechAsync("q", GeneratedSpeechVoice.Alloy)).Value);
        return PhysicalFile(path, "text/plain");
    }

    public async Task<IActionResult> TextAsync(AudioClient voice)
    {
        var path = "/srv/out/8";
        await File.WriteAllTextAsync(path, (await voice.GenerateSpeechAsync("q", GeneratedSpeechVoice.Alloy)).Value);
        return PhysicalFile(path, "text/plain");
    }

    // Propagators: copied into a stream, gathered into a builder or a list.
    public async Task<IActionResult> CopiedToMemory(AudioClient voice)
    {
        var stream = (await voice.GenerateSpeechAsync("q", GeneratedSpeechVoice.Alloy)).Value;
        var memory = new MemoryStream();
        await stream.CopyToAsync(memory);
        return Ok(memory);
    }

    public async Task<IActionResult> Built(AudioClient voice)
    {
        var text = new StringBuilder();
        text.Append((await voice.GenerateSpeechAsync("q", GeneratedSpeechVoice.Alloy)).Value);
        return Ok(text.ToString());
    }

    public async Task<IActionResult> Listed(AudioClient voice)
    {
        var items = new List<object>();
        items.Add((await voice.GenerateSpeechAsync("q", GeneratedSpeechVoice.Alloy)).Value);
        return Ok(items);
    }

    public async Task<IActionResult> ListedRange(AudioClient voice)
    {
        var items = new List<object>();
        items.AddRange((await voice.GenerateSpeechAsync("q", GeneratedSpeechVoice.Alloy)).Value);
        return Ok(items);
    }
}

// Controllers marked by attribute, whatever their name: short, qualified, and with a base of the
// app's own.
[ApiController]
[Route("api/marked")]
public class MarkedApi
{
    public async Task<object> Get(AudioClient voice)
    {
        return (await voice.GenerateSpeechAsync("q", GeneratedSpeechVoice.Alloy)).Value;
    }
}

[Microsoft.AspNetCore.Mvc.ApiController]
public class QualifiedApi : AppEndpointBase
{
    public async Task<object> Get(AudioClient voice)
    {
        return (await voice.GenerateSpeechAsync("q", GeneratedSpeechVoice.Alloy)).Value;
    }
}

[Controller]
public class MarkedMvc
{
    public async Task<object> Get(AudioClient voice)
    {
        return (await voice.GenerateSpeechAsync("q", GeneratedSpeechVoice.Alloy)).Value;
    }
}

[Microsoft.AspNetCore.Mvc.Controller]
public class QualifiedMvc
{
    public async Task<object> Get(AudioClient voice)
    {
        return (await voice.GenerateSpeechAsync("q", GeneratedSpeechVoice.Alloy)).Value;
    }
}

// Minimal API handlers, a Results helper outside them, and response writes from middleware.
public static class Endpoints
{
    public static void Map(WebApplication app)
    {
        app.MapPost("/block", async (AudioClient voice) =>
        {
            var output = (await voice.GenerateSpeechAsync("q", GeneratedSpeechVoice.Alloy)).Value;
            return output;
        });
        app.MapGet("/expression", async (AudioClient voice) => (await voice.GenerateSpeechAsync("q", GeneratedSpeechVoice.Alloy)).Value);
    }

    public static async Task<IResult> Ok1(AudioClient voice)
    {
        var output = (await voice.GenerateSpeechAsync("q", GeneratedSpeechVoice.Alloy)).Value;
        return Results.Ok(output);
    }

    public static async Task<IResult> Ok2(AudioClient voice)
    {
        var output = (await voice.GenerateSpeechAsync("q", GeneratedSpeechVoice.Alloy)).Value;
        return TypedResults.Ok(output);
    }

    public static async Task<IResult> Ok3(AudioClient voice)
    {
        var output = (await voice.GenerateSpeechAsync("q", GeneratedSpeechVoice.Alloy)).Value;
        return Http.Results.Ok(output);
    }

    public static async Task<IResult> Ok4(AudioClient voice)
    {
        var output = (await voice.GenerateSpeechAsync("q", GeneratedSpeechVoice.Alloy)).Value;
        return Http.TypedResults.Ok(output);
    }

    public static async Task Middleware(HttpContext context, AudioClient voice)
    {
        await context.Response.WriteAsync((await voice.GenerateSpeechAsync("q", GeneratedSpeechVoice.Alloy)).Value);
    }

    public static async Task MiddlewareBody(HttpContext context, AudioClient voice)
    {
        await context.Response.Body.WriteAsync((await voice.GenerateSpeechAsync("q", GeneratedSpeechVoice.Alloy)).Value);
    }

    public static async Task MiddlewareCopy(HttpContext context, AudioClient voice)
    {
        var stream = (await voice.GenerateSpeechAsync("q", GeneratedSpeechVoice.Alloy)).Value;
        await stream.CopyToAsync(context.Response.Body);
    }

    public static async Task TypedQualified(Http.HttpResponse response, AudioClient voice)
    {
        await response.WriteAsync((await voice.GenerateSpeechAsync("q", GeneratedSpeechVoice.Alloy)).Value);
    }

    public static async Task Typed(HttpResponse response, AudioClient voice)
    {
        await response.WriteAsync((await voice.GenerateSpeechAsync("q", GeneratedSpeechVoice.Alloy)).Value);
    }
}

// A Razor Page, Blazor components, and the Razor copy of a .razor file.
public class OutputModel : PageModel
{
    public object? Output { get; set; }

    public async Task OnPostAsync(AudioClient voice)
    {
        Output = (await voice.GenerateSpeechAsync("q", GeneratedSpeechVoice.Alloy)).Value;
    }
}

public class Panel : ComponentBase
{
    private object? shown;

    private async Task Show(AudioClient voice)
    {
        shown = (await voice.GenerateSpeechAsync("q", GeneratedSpeechVoice.Alloy)).Value;
    }
}

public class OwnedPanel : OwningComponentBase
{
    private object? shown;

    private async Task Show(AudioClient voice)
    {
        shown = (await voice.GenerateSpeechAsync("q", GeneratedSpeechVoice.Alloy)).Value;
    }
}

public class Shell : LayoutComponentBase
{
    private object? banner;

    private async Task Show(AudioClient voice)
    {
        banner = (await voice.GenerateSpeechAsync("q", GeneratedSpeechVoice.Alloy)).Value;
    }
}

public class Feed : ComponentBase
{
    private readonly List<object> items = [];

    private async Task Show(AudioClient voice)
    {
        items.Add((await voice.GenerateSpeechAsync("q", GeneratedSpeechVoice.Alloy)).Value);
    }
}

class __RazorCode
{
    object? shown;

    async Task Show(AudioClient voice)
    {
        shown = (await voice.GenerateSpeechAsync("q", GeneratedSpeechVoice.Alloy)).Value;
    }
}

// SignalR: a hub on the app's own base hub, a hub context, and a strongly typed hub.
public class RelayHub : AppHubBase
{
    public async Task All(AudioClient voice)
    {
        await Clients.All.SendAsync("output", (await voice.GenerateSpeechAsync("q", GeneratedSpeechVoice.Alloy)).Value);
    }

    public async Task Group(AudioClient voice)
    {
        await Clients.Group("room").SendAsync("output", (await voice.GenerateSpeechAsync("q", GeneratedSpeechVoice.Alloy)).Value);
    }
}

public class Notifier(IHubContext<RelayHub> hub)
{
    public async Task All(AudioClient voice)
    {
        await hub.Clients.All.SendAsync("output", (await voice.GenerateSpeechAsync("q", GeneratedSpeechVoice.Alloy)).Value);
    }

    public async Task Group(AudioClient voice)
    {
        await hub.Clients.Group("room").SendAsync("output", (await voice.GenerateSpeechAsync("q", GeneratedSpeechVoice.Alloy)).Value);
    }
}

public interface IOutputClient
{
    Task Show(object output);
}

public class OutputHub : Hub<IOutputClient>
{
    public async Task Caller(AudioClient voice)
    {
        await Clients.Caller.Show((await voice.GenerateSpeechAsync("q", GeneratedSpeechVoice.Alloy)).Value);
    }

    public async Task One(AudioClient voice)
    {
        await Clients.Client("connection").Show((await voice.GenerateSpeechAsync("q", GeneratedSpeechVoice.Alloy)).Value);
    }

    public async Task<object> Returned(AudioClient voice)
    {
        return (await voice.GenerateSpeechAsync("q", GeneratedSpeechVoice.Alloy)).Value;
    }

    public async IAsyncEnumerable<object> Streamed(AudioClient voice)
    {
        var output = (await voice.GenerateSpeechAsync("q", GeneratedSpeechVoice.Alloy)).Value;
        yield return output;
    }
}

// .NET MAUI pages.
public class OutputPage : ContentPage
{
    private readonly Label label = new();

    private async void Show(AudioClient voice)
    {
        label.Text = (await voice.GenerateSpeechAsync("q", GeneratedSpeechVoice.Alloy)).Value;
    }
}

public class AliasedPage : Mc.ContentPage
{
    private readonly Label label = new();

    private async void Show(AudioClient voice)
    {
        label.Text = (await voice.GenerateSpeechAsync("q", GeneratedSpeechVoice.Alloy)).Value;
    }
}
