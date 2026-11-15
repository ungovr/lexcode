// lexcode-expect: 52
// Every sink and propagator branch of the rule, each reached alone, with the rule's own source.
// Microsoft.AspNetCore.Http, System.IO and Microsoft.Maui.Controls are not imported (they are
// implicit), so a short form and its aliased qualified form each have a case of their own.
using Microsoft.Extensions.AI;
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
    public async Task<IActionResult> Returned(IChatClient chat)
    {
        var output = (await chat.GetResponseAsync("q")).Text;
        return Ok(output);
    }

    // Streamed with yield return.
    public async IAsyncEnumerable<object> Streamed(IChatClient chat)
    {
        var output = (await chat.GetResponseAsync("q")).Text;
        yield return output;
    }

    // An expression body.
    public async Task<object> Expression(IChatClient chat) => (await chat.GetResponseAsync("q")).Text;

    // The response body, written from the action.
    public async Task Written(IChatClient chat)
    {
        await Response.WriteAsync((await chat.GetResponseAsync("q")).Text);
    }

    public async Task WrittenToBody(IChatClient chat)
    {
        await Response.Body.WriteAsync((await chat.GetResponseAsync("q")).Text);
    }

    public async Task Copied(IChatClient chat)
    {
        var stream = (await chat.GetResponseAsync("q")).Text;
        await stream.CopyToAsync(Response.Body);
    }

    // View data.
    public async Task Bag(IChatClient chat)
    {
        ViewBag.Output = (await chat.GetResponseAsync("q")).Text;
    }

    public async Task Data(IChatClient chat)
    {
        ViewData["output"] = (await chat.GetResponseAsync("q")).Text;
    }

    public async Task Temp(IChatClient chat)
    {
        TempData["output"] = (await chat.GetResponseAsync("q")).Text;
    }

    // Propagators: written to a file, then the file is the response.
    public async Task<IActionResult> BytesQualified(IChatClient chat)
    {
        var path = "/srv/out/1";
        System.IO.File.WriteAllBytes(path, (await chat.GetResponseAsync("q")).Text);
        return PhysicalFile(path, "application/octet-stream");
    }

    public async Task<IActionResult> Bytes(IChatClient chat)
    {
        var path = "/srv/out/2";
        File.WriteAllBytes(path, (await chat.GetResponseAsync("q")).Text);
        return PhysicalFile(path, "application/octet-stream");
    }

    public async Task<IActionResult> BytesAsyncQualified(IChatClient chat)
    {
        var path = "/srv/out/3";
        await System.IO.File.WriteAllBytesAsync(path, (await chat.GetResponseAsync("q")).Text);
        return PhysicalFile(path, "application/octet-stream");
    }

    public async Task<IActionResult> BytesAsync(IChatClient chat)
    {
        var path = "/srv/out/4";
        await File.WriteAllBytesAsync(path, (await chat.GetResponseAsync("q")).Text);
        return PhysicalFile(path, "application/octet-stream");
    }

    public async Task<IActionResult> TextQualified(IChatClient chat)
    {
        var path = "/srv/out/5";
        System.IO.File.WriteAllText(path, (await chat.GetResponseAsync("q")).Text);
        return PhysicalFile(path, "text/plain");
    }

    public async Task<IActionResult> Text(IChatClient chat)
    {
        var path = "/srv/out/6";
        File.WriteAllText(path, (await chat.GetResponseAsync("q")).Text);
        return PhysicalFile(path, "text/plain");
    }

    public async Task<IActionResult> TextAsyncQualified(IChatClient chat)
    {
        var path = "/srv/out/7";
        await System.IO.File.WriteAllTextAsync(path, (await chat.GetResponseAsync("q")).Text);
        return PhysicalFile(path, "text/plain");
    }

    public async Task<IActionResult> TextAsync(IChatClient chat)
    {
        var path = "/srv/out/8";
        await File.WriteAllTextAsync(path, (await chat.GetResponseAsync("q")).Text);
        return PhysicalFile(path, "text/plain");
    }

    // Propagators: copied into a stream, gathered into a builder or a list.
    public async Task<IActionResult> CopiedToMemory(IChatClient chat)
    {
        var stream = (await chat.GetResponseAsync("q")).Text;
        var memory = new MemoryStream();
        await stream.CopyToAsync(memory);
        return Ok(memory);
    }

    public async Task<IActionResult> Built(IChatClient chat)
    {
        var text = new StringBuilder();
        text.Append((await chat.GetResponseAsync("q")).Text);
        return Ok(text.ToString());
    }

    public async Task<IActionResult> Listed(IChatClient chat)
    {
        var items = new List<object>();
        items.Add((await chat.GetResponseAsync("q")).Text);
        return Ok(items);
    }

    public async Task<IActionResult> ListedRange(IChatClient chat)
    {
        var items = new List<object>();
        items.AddRange((await chat.GetResponseAsync("q")).Text);
        return Ok(items);
    }
}

// Controllers marked by attribute, whatever their name: short, qualified, and with a base of the
// app's own.
[ApiController]
[Route("api/marked")]
public class MarkedApi
{
    public async Task<object> Get(IChatClient chat)
    {
        return (await chat.GetResponseAsync("q")).Text;
    }
}

[Microsoft.AspNetCore.Mvc.ApiController]
public class QualifiedApi : AppEndpointBase
{
    public async Task<object> Get(IChatClient chat)
    {
        return (await chat.GetResponseAsync("q")).Text;
    }
}

[Controller]
public class MarkedMvc
{
    public async Task<object> Get(IChatClient chat)
    {
        return (await chat.GetResponseAsync("q")).Text;
    }
}

[Microsoft.AspNetCore.Mvc.Controller]
public class QualifiedMvc
{
    public async Task<object> Get(IChatClient chat)
    {
        return (await chat.GetResponseAsync("q")).Text;
    }
}

// Minimal API handlers, a Results helper outside them, and response writes from middleware.
public static class Endpoints
{
    public static void Map(WebApplication app)
    {
        app.MapPost("/block", async (IChatClient chat) =>
        {
            var output = (await chat.GetResponseAsync("q")).Text;
            return output;
        });
        app.MapGet("/expression", async (IChatClient chat) => (await chat.GetResponseAsync("q")).Text);
    }

    public static async Task<IResult> Ok1(IChatClient chat)
    {
        var output = (await chat.GetResponseAsync("q")).Text;
        return Results.Ok(output);
    }

    public static async Task<IResult> Ok2(IChatClient chat)
    {
        var output = (await chat.GetResponseAsync("q")).Text;
        return TypedResults.Ok(output);
    }

    public static async Task<IResult> Ok3(IChatClient chat)
    {
        var output = (await chat.GetResponseAsync("q")).Text;
        return Http.Results.Ok(output);
    }

    public static async Task<IResult> Ok4(IChatClient chat)
    {
        var output = (await chat.GetResponseAsync("q")).Text;
        return Http.TypedResults.Ok(output);
    }

    public static async Task Middleware(HttpContext context, IChatClient chat)
    {
        await context.Response.WriteAsync((await chat.GetResponseAsync("q")).Text);
    }

    public static async Task MiddlewareBody(HttpContext context, IChatClient chat)
    {
        await context.Response.Body.WriteAsync((await chat.GetResponseAsync("q")).Text);
    }

    public static async Task MiddlewareCopy(HttpContext context, IChatClient chat)
    {
        var stream = (await chat.GetResponseAsync("q")).Text;
        await stream.CopyToAsync(context.Response.Body);
    }

    public static async Task TypedQualified(Http.HttpResponse response, IChatClient chat)
    {
        await response.WriteAsync((await chat.GetResponseAsync("q")).Text);
    }

    public static async Task Typed(HttpResponse response, IChatClient chat)
    {
        await response.WriteAsync((await chat.GetResponseAsync("q")).Text);
    }
}

// A Razor Page, Blazor components, and the Razor copy of a .razor file.
public class OutputModel : PageModel
{
    public object? Output { get; set; }

    public async Task OnPostAsync(IChatClient chat)
    {
        Output = (await chat.GetResponseAsync("q")).Text;
    }
}

public class Panel : ComponentBase
{
    private object? shown;

    private async Task Show(IChatClient chat)
    {
        shown = (await chat.GetResponseAsync("q")).Text;
    }
}

public class OwnedPanel : OwningComponentBase
{
    private object? shown;

    private async Task Show(IChatClient chat)
    {
        shown = (await chat.GetResponseAsync("q")).Text;
    }
}

public class Shell : LayoutComponentBase
{
    private object? banner;

    private async Task Show(IChatClient chat)
    {
        banner = (await chat.GetResponseAsync("q")).Text;
    }
}

public class Feed : ComponentBase
{
    private readonly List<object> items = [];

    private async Task Show(IChatClient chat)
    {
        items.Add((await chat.GetResponseAsync("q")).Text);
    }
}

class __RazorCode
{
    object? shown;

    async Task Show(IChatClient chat)
    {
        shown = (await chat.GetResponseAsync("q")).Text;
    }
}

// SignalR: a hub on the app's own base hub, a hub context, and a strongly typed hub.
public class RelayHub : AppHubBase
{
    public async Task All(IChatClient chat)
    {
        await Clients.All.SendAsync("output", (await chat.GetResponseAsync("q")).Text);
    }

    public async Task Group(IChatClient chat)
    {
        await Clients.Group("room").SendAsync("output", (await chat.GetResponseAsync("q")).Text);
    }
}

public class Notifier(IHubContext<RelayHub> hub)
{
    public async Task All(IChatClient chat)
    {
        await hub.Clients.All.SendAsync("output", (await chat.GetResponseAsync("q")).Text);
    }

    public async Task Group(IChatClient chat)
    {
        await hub.Clients.Group("room").SendAsync("output", (await chat.GetResponseAsync("q")).Text);
    }
}

public interface IOutputClient
{
    Task Show(object output);
}

public class OutputHub : Hub<IOutputClient>
{
    public async Task Caller(IChatClient chat)
    {
        await Clients.Caller.Show((await chat.GetResponseAsync("q")).Text);
    }

    public async Task One(IChatClient chat)
    {
        await Clients.Client("connection").Show((await chat.GetResponseAsync("q")).Text);
    }

    public async Task<object> Returned(IChatClient chat)
    {
        return (await chat.GetResponseAsync("q")).Text;
    }

    public async IAsyncEnumerable<object> Streamed(IChatClient chat)
    {
        var output = (await chat.GetResponseAsync("q")).Text;
        yield return output;
    }
}

// .NET MAUI pages.
public class OutputPage : ContentPage
{
    private readonly Label label = new();

    private async void Show(IChatClient chat)
    {
        label.Text = (await chat.GetResponseAsync("q")).Text;
    }
}

public class AliasedPage : Mc.ContentPage
{
    private readonly Label label = new();

    private async void Show(IChatClient chat)
    {
        label.Text = (await chat.GetResponseAsync("q")).Text;
    }
}
