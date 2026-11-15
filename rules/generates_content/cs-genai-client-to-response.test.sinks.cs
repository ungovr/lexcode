// lexcode-expect: 52
// Every sink and propagator branch of the rule, each reached alone, with the rule's own source.
// Microsoft.AspNetCore.Http, System.IO and Microsoft.Maui.Controls are not imported (they are
// implicit), so a short form and its aliased qualified form each have a case of their own.
using Mscc.GenerativeAI;
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
    public async Task<IActionResult> Returned(GoogleAI googleAI)
    {
        var output = (await googleAI.GenerativeModel("gemini-2.5-flash").GenerateContent("q")).Text;
        return Ok(output);
    }

    // Streamed with yield return.
    public async IAsyncEnumerable<object> Streamed(GoogleAI googleAI)
    {
        var output = (await googleAI.GenerativeModel("gemini-2.5-flash").GenerateContent("q")).Text;
        yield return output;
    }

    // An expression body.
    public async Task<object> Expression(GoogleAI googleAI) => (await googleAI.GenerativeModel("gemini-2.5-flash").GenerateContent("q")).Text;

    // The response body, written from the action.
    public async Task Written(GoogleAI googleAI)
    {
        await Response.WriteAsync((await googleAI.GenerativeModel("gemini-2.5-flash").GenerateContent("q")).Text);
    }

    public async Task WrittenToBody(GoogleAI googleAI)
    {
        await Response.Body.WriteAsync((await googleAI.GenerativeModel("gemini-2.5-flash").GenerateContent("q")).Text);
    }

    public async Task Copied(GoogleAI googleAI)
    {
        var stream = (await googleAI.GenerativeModel("gemini-2.5-flash").GenerateContent("q")).Text;
        await stream.CopyToAsync(Response.Body);
    }

    // View data.
    public async Task Bag(GoogleAI googleAI)
    {
        ViewBag.Output = (await googleAI.GenerativeModel("gemini-2.5-flash").GenerateContent("q")).Text;
    }

    public async Task Data(GoogleAI googleAI)
    {
        ViewData["output"] = (await googleAI.GenerativeModel("gemini-2.5-flash").GenerateContent("q")).Text;
    }

    public async Task Temp(GoogleAI googleAI)
    {
        TempData["output"] = (await googleAI.GenerativeModel("gemini-2.5-flash").GenerateContent("q")).Text;
    }

    // Propagators: written to a file, then the file is the response.
    public async Task<IActionResult> BytesQualified(GoogleAI googleAI)
    {
        var path = "/srv/out/1";
        System.IO.File.WriteAllBytes(path, (await googleAI.GenerativeModel("gemini-2.5-flash").GenerateContent("q")).Text);
        return PhysicalFile(path, "application/octet-stream");
    }

    public async Task<IActionResult> Bytes(GoogleAI googleAI)
    {
        var path = "/srv/out/2";
        File.WriteAllBytes(path, (await googleAI.GenerativeModel("gemini-2.5-flash").GenerateContent("q")).Text);
        return PhysicalFile(path, "application/octet-stream");
    }

    public async Task<IActionResult> BytesAsyncQualified(GoogleAI googleAI)
    {
        var path = "/srv/out/3";
        await System.IO.File.WriteAllBytesAsync(path, (await googleAI.GenerativeModel("gemini-2.5-flash").GenerateContent("q")).Text);
        return PhysicalFile(path, "application/octet-stream");
    }

    public async Task<IActionResult> BytesAsync(GoogleAI googleAI)
    {
        var path = "/srv/out/4";
        await File.WriteAllBytesAsync(path, (await googleAI.GenerativeModel("gemini-2.5-flash").GenerateContent("q")).Text);
        return PhysicalFile(path, "application/octet-stream");
    }

    public async Task<IActionResult> TextQualified(GoogleAI googleAI)
    {
        var path = "/srv/out/5";
        System.IO.File.WriteAllText(path, (await googleAI.GenerativeModel("gemini-2.5-flash").GenerateContent("q")).Text);
        return PhysicalFile(path, "text/plain");
    }

    public async Task<IActionResult> Text(GoogleAI googleAI)
    {
        var path = "/srv/out/6";
        File.WriteAllText(path, (await googleAI.GenerativeModel("gemini-2.5-flash").GenerateContent("q")).Text);
        return PhysicalFile(path, "text/plain");
    }

    public async Task<IActionResult> TextAsyncQualified(GoogleAI googleAI)
    {
        var path = "/srv/out/7";
        await System.IO.File.WriteAllTextAsync(path, (await googleAI.GenerativeModel("gemini-2.5-flash").GenerateContent("q")).Text);
        return PhysicalFile(path, "text/plain");
    }

    public async Task<IActionResult> TextAsync(GoogleAI googleAI)
    {
        var path = "/srv/out/8";
        await File.WriteAllTextAsync(path, (await googleAI.GenerativeModel("gemini-2.5-flash").GenerateContent("q")).Text);
        return PhysicalFile(path, "text/plain");
    }

    // Propagators: copied into a stream, gathered into a builder or a list.
    public async Task<IActionResult> CopiedToMemory(GoogleAI googleAI)
    {
        var stream = (await googleAI.GenerativeModel("gemini-2.5-flash").GenerateContent("q")).Text;
        var memory = new MemoryStream();
        await stream.CopyToAsync(memory);
        return Ok(memory);
    }

    public async Task<IActionResult> Built(GoogleAI googleAI)
    {
        var text = new StringBuilder();
        text.Append((await googleAI.GenerativeModel("gemini-2.5-flash").GenerateContent("q")).Text);
        return Ok(text.ToString());
    }

    public async Task<IActionResult> Listed(GoogleAI googleAI)
    {
        var items = new List<object>();
        items.Add((await googleAI.GenerativeModel("gemini-2.5-flash").GenerateContent("q")).Text);
        return Ok(items);
    }

    public async Task<IActionResult> ListedRange(GoogleAI googleAI)
    {
        var items = new List<object>();
        items.AddRange((await googleAI.GenerativeModel("gemini-2.5-flash").GenerateContent("q")).Text);
        return Ok(items);
    }
}

// Controllers marked by attribute, whatever their name: short, qualified, and with a base of the
// app's own.
[ApiController]
[Route("api/marked")]
public class MarkedApi
{
    public async Task<object> Get(GoogleAI googleAI)
    {
        return (await googleAI.GenerativeModel("gemini-2.5-flash").GenerateContent("q")).Text;
    }
}

[Microsoft.AspNetCore.Mvc.ApiController]
public class QualifiedApi : AppEndpointBase
{
    public async Task<object> Get(GoogleAI googleAI)
    {
        return (await googleAI.GenerativeModel("gemini-2.5-flash").GenerateContent("q")).Text;
    }
}

[Controller]
public class MarkedMvc
{
    public async Task<object> Get(GoogleAI googleAI)
    {
        return (await googleAI.GenerativeModel("gemini-2.5-flash").GenerateContent("q")).Text;
    }
}

[Microsoft.AspNetCore.Mvc.Controller]
public class QualifiedMvc
{
    public async Task<object> Get(GoogleAI googleAI)
    {
        return (await googleAI.GenerativeModel("gemini-2.5-flash").GenerateContent("q")).Text;
    }
}

// Minimal API handlers, a Results helper outside them, and response writes from middleware.
public static class Endpoints
{
    public static void Map(WebApplication app)
    {
        app.MapPost("/block", async (GoogleAI googleAI) =>
        {
            var output = (await googleAI.GenerativeModel("gemini-2.5-flash").GenerateContent("q")).Text;
            return output;
        });
        app.MapGet("/expression", async (GoogleAI googleAI) => (await googleAI.GenerativeModel("gemini-2.5-flash").GenerateContent("q")).Text);
    }

    public static async Task<IResult> Ok1(GoogleAI googleAI)
    {
        var output = (await googleAI.GenerativeModel("gemini-2.5-flash").GenerateContent("q")).Text;
        return Results.Ok(output);
    }

    public static async Task<IResult> Ok2(GoogleAI googleAI)
    {
        var output = (await googleAI.GenerativeModel("gemini-2.5-flash").GenerateContent("q")).Text;
        return TypedResults.Ok(output);
    }

    public static async Task<IResult> Ok3(GoogleAI googleAI)
    {
        var output = (await googleAI.GenerativeModel("gemini-2.5-flash").GenerateContent("q")).Text;
        return Http.Results.Ok(output);
    }

    public static async Task<IResult> Ok4(GoogleAI googleAI)
    {
        var output = (await googleAI.GenerativeModel("gemini-2.5-flash").GenerateContent("q")).Text;
        return Http.TypedResults.Ok(output);
    }

    public static async Task Middleware(HttpContext context, GoogleAI googleAI)
    {
        await context.Response.WriteAsync((await googleAI.GenerativeModel("gemini-2.5-flash").GenerateContent("q")).Text);
    }

    public static async Task MiddlewareBody(HttpContext context, GoogleAI googleAI)
    {
        await context.Response.Body.WriteAsync((await googleAI.GenerativeModel("gemini-2.5-flash").GenerateContent("q")).Text);
    }

    public static async Task MiddlewareCopy(HttpContext context, GoogleAI googleAI)
    {
        var stream = (await googleAI.GenerativeModel("gemini-2.5-flash").GenerateContent("q")).Text;
        await stream.CopyToAsync(context.Response.Body);
    }

    public static async Task TypedQualified(Http.HttpResponse response, GoogleAI googleAI)
    {
        await response.WriteAsync((await googleAI.GenerativeModel("gemini-2.5-flash").GenerateContent("q")).Text);
    }

    public static async Task Typed(HttpResponse response, GoogleAI googleAI)
    {
        await response.WriteAsync((await googleAI.GenerativeModel("gemini-2.5-flash").GenerateContent("q")).Text);
    }
}

// A Razor Page, Blazor components, and the Razor copy of a .razor file.
public class OutputModel : PageModel
{
    public object? Output { get; set; }

    public async Task OnPostAsync(GoogleAI googleAI)
    {
        Output = (await googleAI.GenerativeModel("gemini-2.5-flash").GenerateContent("q")).Text;
    }
}

public class Panel : ComponentBase
{
    private object? shown;

    private async Task Show(GoogleAI googleAI)
    {
        shown = (await googleAI.GenerativeModel("gemini-2.5-flash").GenerateContent("q")).Text;
    }
}

public class OwnedPanel : OwningComponentBase
{
    private object? shown;

    private async Task Show(GoogleAI googleAI)
    {
        shown = (await googleAI.GenerativeModel("gemini-2.5-flash").GenerateContent("q")).Text;
    }
}

public class Shell : LayoutComponentBase
{
    private object? banner;

    private async Task Show(GoogleAI googleAI)
    {
        banner = (await googleAI.GenerativeModel("gemini-2.5-flash").GenerateContent("q")).Text;
    }
}

public class Feed : ComponentBase
{
    private readonly List<object> items = [];

    private async Task Show(GoogleAI googleAI)
    {
        items.Add((await googleAI.GenerativeModel("gemini-2.5-flash").GenerateContent("q")).Text);
    }
}

class __RazorCode
{
    object? shown;

    async Task Show(GoogleAI googleAI)
    {
        shown = (await googleAI.GenerativeModel("gemini-2.5-flash").GenerateContent("q")).Text;
    }
}

// SignalR: a hub on the app's own base hub, a hub context, and a strongly typed hub.
public class RelayHub : AppHubBase
{
    public async Task All(GoogleAI googleAI)
    {
        await Clients.All.SendAsync("output", (await googleAI.GenerativeModel("gemini-2.5-flash").GenerateContent("q")).Text);
    }

    public async Task Group(GoogleAI googleAI)
    {
        await Clients.Group("room").SendAsync("output", (await googleAI.GenerativeModel("gemini-2.5-flash").GenerateContent("q")).Text);
    }
}

public class Notifier(IHubContext<RelayHub> hub)
{
    public async Task All(GoogleAI googleAI)
    {
        await hub.Clients.All.SendAsync("output", (await googleAI.GenerativeModel("gemini-2.5-flash").GenerateContent("q")).Text);
    }

    public async Task Group(GoogleAI googleAI)
    {
        await hub.Clients.Group("room").SendAsync("output", (await googleAI.GenerativeModel("gemini-2.5-flash").GenerateContent("q")).Text);
    }
}

public interface IOutputClient
{
    Task Show(object output);
}

public class OutputHub : Hub<IOutputClient>
{
    public async Task Caller(GoogleAI googleAI)
    {
        await Clients.Caller.Show((await googleAI.GenerativeModel("gemini-2.5-flash").GenerateContent("q")).Text);
    }

    public async Task One(GoogleAI googleAI)
    {
        await Clients.Client("connection").Show((await googleAI.GenerativeModel("gemini-2.5-flash").GenerateContent("q")).Text);
    }

    public async Task<object> Returned(GoogleAI googleAI)
    {
        return (await googleAI.GenerativeModel("gemini-2.5-flash").GenerateContent("q")).Text;
    }

    public async IAsyncEnumerable<object> Streamed(GoogleAI googleAI)
    {
        var output = (await googleAI.GenerativeModel("gemini-2.5-flash").GenerateContent("q")).Text;
        yield return output;
    }
}

// .NET MAUI pages.
public class OutputPage : ContentPage
{
    private readonly Label label = new();

    private async void Show(GoogleAI googleAI)
    {
        label.Text = (await googleAI.GenerativeModel("gemini-2.5-flash").GenerateContent("q")).Text;
    }
}

public class AliasedPage : Mc.ContentPage
{
    private readonly Label label = new();

    private async void Show(GoogleAI googleAI)
    {
        label.Text = (await googleAI.GenerativeModel("gemini-2.5-flash").GenerateContent("q")).Text;
    }
}
