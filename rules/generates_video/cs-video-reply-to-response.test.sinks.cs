// lexcode-expect: 52
// Every sink and propagator branch of the rule, each reached alone, with the rule's own source.
// Generated with the rule's branches (#13012 fix round 1). Microsoft.AspNetCore.Http, System.IO and
// Microsoft.Maui.Controls are not imported (they are implicit), so a short form and its aliased
// qualified form each have a case of their own.
using Google.GenAI;
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
    public async Task<IActionResult> Returned(Client veo)
    {
        var output = (await veo.Models.GenerateVideosAsync(model: "veo-3.0-generate-001", prompt: "q")).Name;
        return Ok(output);
    }

    // Streamed with yield return.
    public async IAsyncEnumerable<object> Streamed(Client veo)
    {
        var output = (await veo.Models.GenerateVideosAsync(model: "veo-3.0-generate-001", prompt: "q")).Name;
        yield return output;
    }

    // An expression body.
    public async Task<object> Expression(Client veo) => (await veo.Models.GenerateVideosAsync(model: "veo-3.0-generate-001", prompt: "q")).Name;

    // The response body, written from the action.
    public async Task Written(Client veo)
    {
        await Response.WriteAsync((await veo.Models.GenerateVideosAsync(model: "veo-3.0-generate-001", prompt: "q")).Name);
    }

    public async Task WrittenToBody(Client veo)
    {
        await Response.Body.WriteAsync((await veo.Models.GenerateVideosAsync(model: "veo-3.0-generate-001", prompt: "q")).Name);
    }

    public async Task Copied(Client veo)
    {
        var stream = (await veo.Models.GenerateVideosAsync(model: "veo-3.0-generate-001", prompt: "q")).Name;
        await stream.CopyToAsync(Response.Body);
    }

    // View data.
    public async Task Bag(Client veo)
    {
        ViewBag.Output = (await veo.Models.GenerateVideosAsync(model: "veo-3.0-generate-001", prompt: "q")).Name;
    }

    public async Task Data(Client veo)
    {
        ViewData["output"] = (await veo.Models.GenerateVideosAsync(model: "veo-3.0-generate-001", prompt: "q")).Name;
    }

    public async Task Temp(Client veo)
    {
        TempData["output"] = (await veo.Models.GenerateVideosAsync(model: "veo-3.0-generate-001", prompt: "q")).Name;
    }

    // Propagators: written to a file, then the file is the response.
    public async Task<IActionResult> BytesQualified(Client veo)
    {
        var path = "/srv/out/1";
        System.IO.File.WriteAllBytes(path, (await veo.Models.GenerateVideosAsync(model: "veo-3.0-generate-001", prompt: "q")).Name);
        return PhysicalFile(path, "application/octet-stream");
    }

    public async Task<IActionResult> Bytes(Client veo)
    {
        var path = "/srv/out/2";
        File.WriteAllBytes(path, (await veo.Models.GenerateVideosAsync(model: "veo-3.0-generate-001", prompt: "q")).Name);
        return PhysicalFile(path, "application/octet-stream");
    }

    public async Task<IActionResult> BytesAsyncQualified(Client veo)
    {
        var path = "/srv/out/3";
        await System.IO.File.WriteAllBytesAsync(path, (await veo.Models.GenerateVideosAsync(model: "veo-3.0-generate-001", prompt: "q")).Name);
        return PhysicalFile(path, "application/octet-stream");
    }

    public async Task<IActionResult> BytesAsync(Client veo)
    {
        var path = "/srv/out/4";
        await File.WriteAllBytesAsync(path, (await veo.Models.GenerateVideosAsync(model: "veo-3.0-generate-001", prompt: "q")).Name);
        return PhysicalFile(path, "application/octet-stream");
    }

    public async Task<IActionResult> TextQualified(Client veo)
    {
        var path = "/srv/out/5";
        System.IO.File.WriteAllText(path, (await veo.Models.GenerateVideosAsync(model: "veo-3.0-generate-001", prompt: "q")).Name);
        return PhysicalFile(path, "text/plain");
    }

    public async Task<IActionResult> Text(Client veo)
    {
        var path = "/srv/out/6";
        File.WriteAllText(path, (await veo.Models.GenerateVideosAsync(model: "veo-3.0-generate-001", prompt: "q")).Name);
        return PhysicalFile(path, "text/plain");
    }

    public async Task<IActionResult> TextAsyncQualified(Client veo)
    {
        var path = "/srv/out/7";
        await System.IO.File.WriteAllTextAsync(path, (await veo.Models.GenerateVideosAsync(model: "veo-3.0-generate-001", prompt: "q")).Name);
        return PhysicalFile(path, "text/plain");
    }

    public async Task<IActionResult> TextAsync(Client veo)
    {
        var path = "/srv/out/8";
        await File.WriteAllTextAsync(path, (await veo.Models.GenerateVideosAsync(model: "veo-3.0-generate-001", prompt: "q")).Name);
        return PhysicalFile(path, "text/plain");
    }

    // Propagators: copied into a stream, gathered into a builder or a list.
    public async Task<IActionResult> CopiedToMemory(Client veo)
    {
        var stream = (await veo.Models.GenerateVideosAsync(model: "veo-3.0-generate-001", prompt: "q")).Name;
        var memory = new MemoryStream();
        await stream.CopyToAsync(memory);
        return Ok(memory);
    }

    public async Task<IActionResult> Built(Client veo)
    {
        var text = new StringBuilder();
        text.Append((await veo.Models.GenerateVideosAsync(model: "veo-3.0-generate-001", prompt: "q")).Name);
        return Ok(text.ToString());
    }

    public async Task<IActionResult> Listed(Client veo)
    {
        var items = new List<object>();
        items.Add((await veo.Models.GenerateVideosAsync(model: "veo-3.0-generate-001", prompt: "q")).Name);
        return Ok(items);
    }

    public async Task<IActionResult> ListedRange(Client veo)
    {
        var items = new List<object>();
        items.AddRange((await veo.Models.GenerateVideosAsync(model: "veo-3.0-generate-001", prompt: "q")).Name);
        return Ok(items);
    }
}

// Controllers marked by attribute, whatever their name: short, qualified, and with a base of the
// app's own.
[ApiController]
[Route("api/marked")]
public class MarkedApi
{
    public async Task<object> Get(Client veo)
    {
        return (await veo.Models.GenerateVideosAsync(model: "veo-3.0-generate-001", prompt: "q")).Name;
    }
}

[Microsoft.AspNetCore.Mvc.ApiController]
public class QualifiedApi : AppEndpointBase
{
    public async Task<object> Get(Client veo)
    {
        return (await veo.Models.GenerateVideosAsync(model: "veo-3.0-generate-001", prompt: "q")).Name;
    }
}

[Controller]
public class MarkedMvc
{
    public async Task<object> Get(Client veo)
    {
        return (await veo.Models.GenerateVideosAsync(model: "veo-3.0-generate-001", prompt: "q")).Name;
    }
}

[Microsoft.AspNetCore.Mvc.Controller]
public class QualifiedMvc
{
    public async Task<object> Get(Client veo)
    {
        return (await veo.Models.GenerateVideosAsync(model: "veo-3.0-generate-001", prompt: "q")).Name;
    }
}

// Minimal API handlers, a Results helper outside them, and response writes from middleware.
public static class Endpoints
{
    public static void Map(WebApplication app)
    {
        app.MapPost("/block", async (Client veo) =>
        {
            var output = (await veo.Models.GenerateVideosAsync(model: "veo-3.0-generate-001", prompt: "q")).Name;
            return output;
        });
        app.MapGet("/expression", async (Client veo) => (await veo.Models.GenerateVideosAsync(model: "veo-3.0-generate-001", prompt: "q")).Name);
    }

    public static async Task<IResult> Ok1(Client veo)
    {
        var output = (await veo.Models.GenerateVideosAsync(model: "veo-3.0-generate-001", prompt: "q")).Name;
        return Results.Ok(output);
    }

    public static async Task<IResult> Ok2(Client veo)
    {
        var output = (await veo.Models.GenerateVideosAsync(model: "veo-3.0-generate-001", prompt: "q")).Name;
        return TypedResults.Ok(output);
    }

    public static async Task<IResult> Ok3(Client veo)
    {
        var output = (await veo.Models.GenerateVideosAsync(model: "veo-3.0-generate-001", prompt: "q")).Name;
        return Http.Results.Ok(output);
    }

    public static async Task<IResult> Ok4(Client veo)
    {
        var output = (await veo.Models.GenerateVideosAsync(model: "veo-3.0-generate-001", prompt: "q")).Name;
        return Http.TypedResults.Ok(output);
    }

    public static async Task Middleware(HttpContext context, Client veo)
    {
        await context.Response.WriteAsync((await veo.Models.GenerateVideosAsync(model: "veo-3.0-generate-001", prompt: "q")).Name);
    }

    public static async Task MiddlewareBody(HttpContext context, Client veo)
    {
        await context.Response.Body.WriteAsync((await veo.Models.GenerateVideosAsync(model: "veo-3.0-generate-001", prompt: "q")).Name);
    }

    public static async Task MiddlewareCopy(HttpContext context, Client veo)
    {
        var stream = (await veo.Models.GenerateVideosAsync(model: "veo-3.0-generate-001", prompt: "q")).Name;
        await stream.CopyToAsync(context.Response.Body);
    }

    public static async Task TypedQualified(Http.HttpResponse response, Client veo)
    {
        await response.WriteAsync((await veo.Models.GenerateVideosAsync(model: "veo-3.0-generate-001", prompt: "q")).Name);
    }

    public static async Task Typed(HttpResponse response, Client veo)
    {
        await response.WriteAsync((await veo.Models.GenerateVideosAsync(model: "veo-3.0-generate-001", prompt: "q")).Name);
    }
}

// A Razor Page, Blazor components, and the Razor copy of a .razor file.
public class OutputModel : PageModel
{
    public object? Output { get; set; }

    public async Task OnPostAsync(Client veo)
    {
        Output = (await veo.Models.GenerateVideosAsync(model: "veo-3.0-generate-001", prompt: "q")).Name;
    }
}

public class Panel : ComponentBase
{
    private object? shown;

    private async Task Show(Client veo)
    {
        shown = (await veo.Models.GenerateVideosAsync(model: "veo-3.0-generate-001", prompt: "q")).Name;
    }
}

public class OwnedPanel : OwningComponentBase
{
    private object? shown;

    private async Task Show(Client veo)
    {
        shown = (await veo.Models.GenerateVideosAsync(model: "veo-3.0-generate-001", prompt: "q")).Name;
    }
}

public class Shell : LayoutComponentBase
{
    private object? banner;

    private async Task Show(Client veo)
    {
        banner = (await veo.Models.GenerateVideosAsync(model: "veo-3.0-generate-001", prompt: "q")).Name;
    }
}

public class Feed : ComponentBase
{
    private readonly List<object> items = [];

    private async Task Show(Client veo)
    {
        items.Add((await veo.Models.GenerateVideosAsync(model: "veo-3.0-generate-001", prompt: "q")).Name);
    }
}

class __RazorCode
{
    object? shown;

    async Task Show(Client veo)
    {
        shown = (await veo.Models.GenerateVideosAsync(model: "veo-3.0-generate-001", prompt: "q")).Name;
    }
}

// SignalR: a hub on the app's own base hub, a hub context, and a strongly typed hub.
public class RelayHub : AppHubBase
{
    public async Task All(Client veo)
    {
        await Clients.All.SendAsync("output", (await veo.Models.GenerateVideosAsync(model: "veo-3.0-generate-001", prompt: "q")).Name);
    }

    public async Task Group(Client veo)
    {
        await Clients.Group("room").SendAsync("output", (await veo.Models.GenerateVideosAsync(model: "veo-3.0-generate-001", prompt: "q")).Name);
    }
}

public class Notifier(IHubContext<RelayHub> hub)
{
    public async Task All(Client veo)
    {
        await hub.Clients.All.SendAsync("output", (await veo.Models.GenerateVideosAsync(model: "veo-3.0-generate-001", prompt: "q")).Name);
    }

    public async Task Group(Client veo)
    {
        await hub.Clients.Group("room").SendAsync("output", (await veo.Models.GenerateVideosAsync(model: "veo-3.0-generate-001", prompt: "q")).Name);
    }
}

public interface IOutputClient
{
    Task Show(object output);
}

public class OutputHub : Hub<IOutputClient>
{
    public async Task Caller(Client veo)
    {
        await Clients.Caller.Show((await veo.Models.GenerateVideosAsync(model: "veo-3.0-generate-001", prompt: "q")).Name);
    }

    public async Task One(Client veo)
    {
        await Clients.Client("connection").Show((await veo.Models.GenerateVideosAsync(model: "veo-3.0-generate-001", prompt: "q")).Name);
    }

    public async Task<object> Returned(Client veo)
    {
        return (await veo.Models.GenerateVideosAsync(model: "veo-3.0-generate-001", prompt: "q")).Name;
    }

    public async IAsyncEnumerable<object> Streamed(Client veo)
    {
        var output = (await veo.Models.GenerateVideosAsync(model: "veo-3.0-generate-001", prompt: "q")).Name;
        yield return output;
    }
}

// .NET MAUI pages.
public class OutputPage : ContentPage
{
    private readonly Label label = new();

    private async void Show(Client veo)
    {
        label.Text = (await veo.Models.GenerateVideosAsync(model: "veo-3.0-generate-001", prompt: "q")).Name;
    }
}

public class AliasedPage : Mc.ContentPage
{
    private readonly Label label = new();

    private async void Show(Client veo)
    {
        label.Text = (await veo.Models.GenerateVideosAsync(model: "veo-3.0-generate-001", prompt: "q")).Name;
    }
}
