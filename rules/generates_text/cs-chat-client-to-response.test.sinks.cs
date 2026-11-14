// lexcode-expect: 52
// Every sink and propagator branch of the rule, each reached alone, with the rule's own source.
// Generated with the rule's branches (#13012 fix round 1). Microsoft.AspNetCore.Http, System.IO and
// Microsoft.Maui.Controls are not imported (they are implicit), so a short form and its aliased
// qualified form each have a case of their own.
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
    public async Task<IActionResult> Returned(IServiceProvider services)
    {
        var output = (await services.GetRequiredService<IChatClient>().GetResponseAsync("q")).Text;
        return Ok(output);
    }

    // Streamed with yield return.
    public async IAsyncEnumerable<object> Streamed(IServiceProvider services)
    {
        var output = (await services.GetRequiredService<IChatClient>().GetResponseAsync("q")).Text;
        yield return output;
    }

    // An expression body.
    public async Task<object> Expression(IServiceProvider services) => (await services.GetRequiredService<IChatClient>().GetResponseAsync("q")).Text;

    // The response body, written from the action.
    public async Task Written(IServiceProvider services)
    {
        await Response.WriteAsync((await services.GetRequiredService<IChatClient>().GetResponseAsync("q")).Text);
    }

    public async Task WrittenToBody(IServiceProvider services)
    {
        await Response.Body.WriteAsync((await services.GetRequiredService<IChatClient>().GetResponseAsync("q")).Text);
    }

    public async Task Copied(IServiceProvider services)
    {
        var stream = (await services.GetRequiredService<IChatClient>().GetResponseAsync("q")).Text;
        await stream.CopyToAsync(Response.Body);
    }

    // View data.
    public async Task Bag(IServiceProvider services)
    {
        ViewBag.Output = (await services.GetRequiredService<IChatClient>().GetResponseAsync("q")).Text;
    }

    public async Task Data(IServiceProvider services)
    {
        ViewData["output"] = (await services.GetRequiredService<IChatClient>().GetResponseAsync("q")).Text;
    }

    public async Task Temp(IServiceProvider services)
    {
        TempData["output"] = (await services.GetRequiredService<IChatClient>().GetResponseAsync("q")).Text;
    }

    // Propagators: written to a file, then the file is the response.
    public async Task<IActionResult> BytesQualified(IServiceProvider services)
    {
        var path = "/srv/out/1";
        System.IO.File.WriteAllBytes(path, (await services.GetRequiredService<IChatClient>().GetResponseAsync("q")).Text);
        return PhysicalFile(path, "application/octet-stream");
    }

    public async Task<IActionResult> Bytes(IServiceProvider services)
    {
        var path = "/srv/out/2";
        File.WriteAllBytes(path, (await services.GetRequiredService<IChatClient>().GetResponseAsync("q")).Text);
        return PhysicalFile(path, "application/octet-stream");
    }

    public async Task<IActionResult> BytesAsyncQualified(IServiceProvider services)
    {
        var path = "/srv/out/3";
        await System.IO.File.WriteAllBytesAsync(path, (await services.GetRequiredService<IChatClient>().GetResponseAsync("q")).Text);
        return PhysicalFile(path, "application/octet-stream");
    }

    public async Task<IActionResult> BytesAsync(IServiceProvider services)
    {
        var path = "/srv/out/4";
        await File.WriteAllBytesAsync(path, (await services.GetRequiredService<IChatClient>().GetResponseAsync("q")).Text);
        return PhysicalFile(path, "application/octet-stream");
    }

    public async Task<IActionResult> TextQualified(IServiceProvider services)
    {
        var path = "/srv/out/5";
        System.IO.File.WriteAllText(path, (await services.GetRequiredService<IChatClient>().GetResponseAsync("q")).Text);
        return PhysicalFile(path, "text/plain");
    }

    public async Task<IActionResult> Text(IServiceProvider services)
    {
        var path = "/srv/out/6";
        File.WriteAllText(path, (await services.GetRequiredService<IChatClient>().GetResponseAsync("q")).Text);
        return PhysicalFile(path, "text/plain");
    }

    public async Task<IActionResult> TextAsyncQualified(IServiceProvider services)
    {
        var path = "/srv/out/7";
        await System.IO.File.WriteAllTextAsync(path, (await services.GetRequiredService<IChatClient>().GetResponseAsync("q")).Text);
        return PhysicalFile(path, "text/plain");
    }

    public async Task<IActionResult> TextAsync(IServiceProvider services)
    {
        var path = "/srv/out/8";
        await File.WriteAllTextAsync(path, (await services.GetRequiredService<IChatClient>().GetResponseAsync("q")).Text);
        return PhysicalFile(path, "text/plain");
    }

    // Propagators: copied into a stream, gathered into a builder or a list.
    public async Task<IActionResult> CopiedToMemory(IServiceProvider services)
    {
        var stream = (await services.GetRequiredService<IChatClient>().GetResponseAsync("q")).Text;
        var memory = new MemoryStream();
        await stream.CopyToAsync(memory);
        return Ok(memory);
    }

    public async Task<IActionResult> Built(IServiceProvider services)
    {
        var text = new StringBuilder();
        text.Append((await services.GetRequiredService<IChatClient>().GetResponseAsync("q")).Text);
        return Ok(text.ToString());
    }

    public async Task<IActionResult> Listed(IServiceProvider services)
    {
        var items = new List<object>();
        items.Add((await services.GetRequiredService<IChatClient>().GetResponseAsync("q")).Text);
        return Ok(items);
    }

    public async Task<IActionResult> ListedRange(IServiceProvider services)
    {
        var items = new List<object>();
        items.AddRange((await services.GetRequiredService<IChatClient>().GetResponseAsync("q")).Text);
        return Ok(items);
    }
}

// Controllers marked by attribute, whatever their name: short, qualified, and with a base of the
// app's own.
[ApiController]
[Route("api/marked")]
public class MarkedApi
{
    public async Task<object> Get(IServiceProvider services)
    {
        return (await services.GetRequiredService<IChatClient>().GetResponseAsync("q")).Text;
    }
}

[Microsoft.AspNetCore.Mvc.ApiController]
public class QualifiedApi : AppEndpointBase
{
    public async Task<object> Get(IServiceProvider services)
    {
        return (await services.GetRequiredService<IChatClient>().GetResponseAsync("q")).Text;
    }
}

[Controller]
public class MarkedMvc
{
    public async Task<object> Get(IServiceProvider services)
    {
        return (await services.GetRequiredService<IChatClient>().GetResponseAsync("q")).Text;
    }
}

[Microsoft.AspNetCore.Mvc.Controller]
public class QualifiedMvc
{
    public async Task<object> Get(IServiceProvider services)
    {
        return (await services.GetRequiredService<IChatClient>().GetResponseAsync("q")).Text;
    }
}

// Minimal API handlers, a Results helper outside them, and response writes from middleware.
public static class Endpoints
{
    public static void Map(WebApplication app)
    {
        app.MapPost("/block", async (IServiceProvider services) =>
        {
            var output = (await services.GetRequiredService<IChatClient>().GetResponseAsync("q")).Text;
            return output;
        });
        app.MapGet("/expression", async (IServiceProvider services) => (await services.GetRequiredService<IChatClient>().GetResponseAsync("q")).Text);
    }

    public static async Task<IResult> Ok1(IServiceProvider services)
    {
        var output = (await services.GetRequiredService<IChatClient>().GetResponseAsync("q")).Text;
        return Results.Ok(output);
    }

    public static async Task<IResult> Ok2(IServiceProvider services)
    {
        var output = (await services.GetRequiredService<IChatClient>().GetResponseAsync("q")).Text;
        return TypedResults.Ok(output);
    }

    public static async Task<IResult> Ok3(IServiceProvider services)
    {
        var output = (await services.GetRequiredService<IChatClient>().GetResponseAsync("q")).Text;
        return Http.Results.Ok(output);
    }

    public static async Task<IResult> Ok4(IServiceProvider services)
    {
        var output = (await services.GetRequiredService<IChatClient>().GetResponseAsync("q")).Text;
        return Http.TypedResults.Ok(output);
    }

    public static async Task Middleware(HttpContext context, IServiceProvider services)
    {
        await context.Response.WriteAsync((await services.GetRequiredService<IChatClient>().GetResponseAsync("q")).Text);
    }

    public static async Task MiddlewareBody(HttpContext context, IServiceProvider services)
    {
        await context.Response.Body.WriteAsync((await services.GetRequiredService<IChatClient>().GetResponseAsync("q")).Text);
    }

    public static async Task MiddlewareCopy(HttpContext context, IServiceProvider services)
    {
        var stream = (await services.GetRequiredService<IChatClient>().GetResponseAsync("q")).Text;
        await stream.CopyToAsync(context.Response.Body);
    }

    public static async Task TypedQualified(Http.HttpResponse response, IServiceProvider services)
    {
        await response.WriteAsync((await services.GetRequiredService<IChatClient>().GetResponseAsync("q")).Text);
    }

    public static async Task Typed(HttpResponse response, IServiceProvider services)
    {
        await response.WriteAsync((await services.GetRequiredService<IChatClient>().GetResponseAsync("q")).Text);
    }
}

// A Razor Page, Blazor components, and the Razor copy of a .razor file.
public class OutputModel : PageModel
{
    public object? Output { get; set; }

    public async Task OnPostAsync(IServiceProvider services)
    {
        Output = (await services.GetRequiredService<IChatClient>().GetResponseAsync("q")).Text;
    }
}

public class Panel : ComponentBase
{
    private object? shown;

    private async Task Show(IServiceProvider services)
    {
        shown = (await services.GetRequiredService<IChatClient>().GetResponseAsync("q")).Text;
    }
}

public class OwnedPanel : OwningComponentBase
{
    private object? shown;

    private async Task Show(IServiceProvider services)
    {
        shown = (await services.GetRequiredService<IChatClient>().GetResponseAsync("q")).Text;
    }
}

public class Shell : LayoutComponentBase
{
    private object? banner;

    private async Task Show(IServiceProvider services)
    {
        banner = (await services.GetRequiredService<IChatClient>().GetResponseAsync("q")).Text;
    }
}

public class Feed : ComponentBase
{
    private readonly List<object> items = [];

    private async Task Show(IServiceProvider services)
    {
        items.Add((await services.GetRequiredService<IChatClient>().GetResponseAsync("q")).Text);
    }
}

class __RazorCode
{
    object? shown;

    async Task Show(IServiceProvider services)
    {
        shown = (await services.GetRequiredService<IChatClient>().GetResponseAsync("q")).Text;
    }
}

// SignalR: a hub on the app's own base hub, a hub context, and a strongly typed hub.
public class RelayHub : AppHubBase
{
    public async Task All(IServiceProvider services)
    {
        await Clients.All.SendAsync("output", (await services.GetRequiredService<IChatClient>().GetResponseAsync("q")).Text);
    }

    public async Task Group(IServiceProvider services)
    {
        await Clients.Group("room").SendAsync("output", (await services.GetRequiredService<IChatClient>().GetResponseAsync("q")).Text);
    }
}

public class Notifier(IHubContext<RelayHub> hub)
{
    public async Task All(IServiceProvider services)
    {
        await hub.Clients.All.SendAsync("output", (await services.GetRequiredService<IChatClient>().GetResponseAsync("q")).Text);
    }

    public async Task Group(IServiceProvider services)
    {
        await hub.Clients.Group("room").SendAsync("output", (await services.GetRequiredService<IChatClient>().GetResponseAsync("q")).Text);
    }
}

public interface IOutputClient
{
    Task Show(object output);
}

public class OutputHub : Hub<IOutputClient>
{
    public async Task Caller(IServiceProvider services)
    {
        await Clients.Caller.Show((await services.GetRequiredService<IChatClient>().GetResponseAsync("q")).Text);
    }

    public async Task One(IServiceProvider services)
    {
        await Clients.Client("connection").Show((await services.GetRequiredService<IChatClient>().GetResponseAsync("q")).Text);
    }

    public async Task<object> Returned(IServiceProvider services)
    {
        return (await services.GetRequiredService<IChatClient>().GetResponseAsync("q")).Text;
    }

    public async IAsyncEnumerable<object> Streamed(IServiceProvider services)
    {
        var output = (await services.GetRequiredService<IChatClient>().GetResponseAsync("q")).Text;
        yield return output;
    }
}

// .NET MAUI pages.
public class OutputPage : ContentPage
{
    private readonly Label label = new();

    private async void Show(IServiceProvider services)
    {
        label.Text = (await services.GetRequiredService<IChatClient>().GetResponseAsync("q")).Text;
    }
}

public class AliasedPage : Mc.ContentPage
{
    private readonly Label label = new();

    private async void Show(IServiceProvider services)
    {
        label.Text = (await services.GetRequiredService<IChatClient>().GetResponseAsync("q")).Text;
    }
}
