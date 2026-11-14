// lexcode-expect: 52
// Every sink and propagator branch of the rule, each reached alone, with the rule's own source.
// Microsoft.AspNetCore.Http, System.IO and Microsoft.Maui.Controls are not imported (they are
// implicit), so a short form and its aliased qualified form each have a case of their own.
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
    public async Task<IActionResult> Returned(Client gemini)
    {
        var output = (await gemini.Models.GenerateContentAsync(model: "gemini-2.5-flash", contents: "q")).Text;
        return Ok(output);
    }

    // Streamed with yield return.
    public async IAsyncEnumerable<object> Streamed(Client gemini)
    {
        var output = (await gemini.Models.GenerateContentAsync(model: "gemini-2.5-flash", contents: "q")).Text;
        yield return output;
    }

    // An expression body.
    public async Task<object> Expression(Client gemini) => (await gemini.Models.GenerateContentAsync(model: "gemini-2.5-flash", contents: "q")).Text;

    // The response body, written from the action.
    public async Task Written(Client gemini)
    {
        await Response.WriteAsync((await gemini.Models.GenerateContentAsync(model: "gemini-2.5-flash", contents: "q")).Text);
    }

    public async Task WrittenToBody(Client gemini)
    {
        await Response.Body.WriteAsync((await gemini.Models.GenerateContentAsync(model: "gemini-2.5-flash", contents: "q")).Text);
    }

    public async Task Copied(Client gemini)
    {
        var stream = (await gemini.Models.GenerateContentAsync(model: "gemini-2.5-flash", contents: "q")).Text;
        await stream.CopyToAsync(Response.Body);
    }

    // View data.
    public async Task Bag(Client gemini)
    {
        ViewBag.Output = (await gemini.Models.GenerateContentAsync(model: "gemini-2.5-flash", contents: "q")).Text;
    }

    public async Task Data(Client gemini)
    {
        ViewData["output"] = (await gemini.Models.GenerateContentAsync(model: "gemini-2.5-flash", contents: "q")).Text;
    }

    public async Task Temp(Client gemini)
    {
        TempData["output"] = (await gemini.Models.GenerateContentAsync(model: "gemini-2.5-flash", contents: "q")).Text;
    }

    // Propagators: written to a file, then the file is the response.
    public async Task<IActionResult> BytesQualified(Client gemini)
    {
        var path = "/srv/out/1";
        System.IO.File.WriteAllBytes(path, (await gemini.Models.GenerateContentAsync(model: "gemini-2.5-flash", contents: "q")).Text);
        return PhysicalFile(path, "application/octet-stream");
    }

    public async Task<IActionResult> Bytes(Client gemini)
    {
        var path = "/srv/out/2";
        File.WriteAllBytes(path, (await gemini.Models.GenerateContentAsync(model: "gemini-2.5-flash", contents: "q")).Text);
        return PhysicalFile(path, "application/octet-stream");
    }

    public async Task<IActionResult> BytesAsyncQualified(Client gemini)
    {
        var path = "/srv/out/3";
        await System.IO.File.WriteAllBytesAsync(path, (await gemini.Models.GenerateContentAsync(model: "gemini-2.5-flash", contents: "q")).Text);
        return PhysicalFile(path, "application/octet-stream");
    }

    public async Task<IActionResult> BytesAsync(Client gemini)
    {
        var path = "/srv/out/4";
        await File.WriteAllBytesAsync(path, (await gemini.Models.GenerateContentAsync(model: "gemini-2.5-flash", contents: "q")).Text);
        return PhysicalFile(path, "application/octet-stream");
    }

    public async Task<IActionResult> TextQualified(Client gemini)
    {
        var path = "/srv/out/5";
        System.IO.File.WriteAllText(path, (await gemini.Models.GenerateContentAsync(model: "gemini-2.5-flash", contents: "q")).Text);
        return PhysicalFile(path, "text/plain");
    }

    public async Task<IActionResult> Text(Client gemini)
    {
        var path = "/srv/out/6";
        File.WriteAllText(path, (await gemini.Models.GenerateContentAsync(model: "gemini-2.5-flash", contents: "q")).Text);
        return PhysicalFile(path, "text/plain");
    }

    public async Task<IActionResult> TextAsyncQualified(Client gemini)
    {
        var path = "/srv/out/7";
        await System.IO.File.WriteAllTextAsync(path, (await gemini.Models.GenerateContentAsync(model: "gemini-2.5-flash", contents: "q")).Text);
        return PhysicalFile(path, "text/plain");
    }

    public async Task<IActionResult> TextAsync(Client gemini)
    {
        var path = "/srv/out/8";
        await File.WriteAllTextAsync(path, (await gemini.Models.GenerateContentAsync(model: "gemini-2.5-flash", contents: "q")).Text);
        return PhysicalFile(path, "text/plain");
    }

    // Propagators: copied into a stream, gathered into a builder or a list.
    public async Task<IActionResult> CopiedToMemory(Client gemini)
    {
        var stream = (await gemini.Models.GenerateContentAsync(model: "gemini-2.5-flash", contents: "q")).Text;
        var memory = new MemoryStream();
        await stream.CopyToAsync(memory);
        return Ok(memory);
    }

    public async Task<IActionResult> Built(Client gemini)
    {
        var text = new StringBuilder();
        text.Append((await gemini.Models.GenerateContentAsync(model: "gemini-2.5-flash", contents: "q")).Text);
        return Ok(text.ToString());
    }

    public async Task<IActionResult> Listed(Client gemini)
    {
        var items = new List<object>();
        items.Add((await gemini.Models.GenerateContentAsync(model: "gemini-2.5-flash", contents: "q")).Text);
        return Ok(items);
    }

    public async Task<IActionResult> ListedRange(Client gemini)
    {
        var items = new List<object>();
        items.AddRange((await gemini.Models.GenerateContentAsync(model: "gemini-2.5-flash", contents: "q")).Text);
        return Ok(items);
    }
}

// Controllers marked by attribute, whatever their name: short, qualified, and with a base of the
// app's own.
[ApiController]
[Route("api/marked")]
public class MarkedApi
{
    public async Task<object> Get(Client gemini)
    {
        return (await gemini.Models.GenerateContentAsync(model: "gemini-2.5-flash", contents: "q")).Text;
    }
}

[Microsoft.AspNetCore.Mvc.ApiController]
public class QualifiedApi : AppEndpointBase
{
    public async Task<object> Get(Client gemini)
    {
        return (await gemini.Models.GenerateContentAsync(model: "gemini-2.5-flash", contents: "q")).Text;
    }
}

[Controller]
public class MarkedMvc
{
    public async Task<object> Get(Client gemini)
    {
        return (await gemini.Models.GenerateContentAsync(model: "gemini-2.5-flash", contents: "q")).Text;
    }
}

[Microsoft.AspNetCore.Mvc.Controller]
public class QualifiedMvc
{
    public async Task<object> Get(Client gemini)
    {
        return (await gemini.Models.GenerateContentAsync(model: "gemini-2.5-flash", contents: "q")).Text;
    }
}

// Minimal API handlers, a Results helper outside them, and response writes from middleware.
public static class Endpoints
{
    public static void Map(WebApplication app)
    {
        app.MapPost("/block", async (Client gemini) =>
        {
            var output = (await gemini.Models.GenerateContentAsync(model: "gemini-2.5-flash", contents: "q")).Text;
            return output;
        });
        app.MapGet("/expression", async (Client gemini) => (await gemini.Models.GenerateContentAsync(model: "gemini-2.5-flash", contents: "q")).Text);
    }

    public static async Task<IResult> Ok1(Client gemini)
    {
        var output = (await gemini.Models.GenerateContentAsync(model: "gemini-2.5-flash", contents: "q")).Text;
        return Results.Ok(output);
    }

    public static async Task<IResult> Ok2(Client gemini)
    {
        var output = (await gemini.Models.GenerateContentAsync(model: "gemini-2.5-flash", contents: "q")).Text;
        return TypedResults.Ok(output);
    }

    public static async Task<IResult> Ok3(Client gemini)
    {
        var output = (await gemini.Models.GenerateContentAsync(model: "gemini-2.5-flash", contents: "q")).Text;
        return Http.Results.Ok(output);
    }

    public static async Task<IResult> Ok4(Client gemini)
    {
        var output = (await gemini.Models.GenerateContentAsync(model: "gemini-2.5-flash", contents: "q")).Text;
        return Http.TypedResults.Ok(output);
    }

    public static async Task Middleware(HttpContext context, Client gemini)
    {
        await context.Response.WriteAsync((await gemini.Models.GenerateContentAsync(model: "gemini-2.5-flash", contents: "q")).Text);
    }

    public static async Task MiddlewareBody(HttpContext context, Client gemini)
    {
        await context.Response.Body.WriteAsync((await gemini.Models.GenerateContentAsync(model: "gemini-2.5-flash", contents: "q")).Text);
    }

    public static async Task MiddlewareCopy(HttpContext context, Client gemini)
    {
        var stream = (await gemini.Models.GenerateContentAsync(model: "gemini-2.5-flash", contents: "q")).Text;
        await stream.CopyToAsync(context.Response.Body);
    }

    public static async Task TypedQualified(Http.HttpResponse response, Client gemini)
    {
        await response.WriteAsync((await gemini.Models.GenerateContentAsync(model: "gemini-2.5-flash", contents: "q")).Text);
    }

    public static async Task Typed(HttpResponse response, Client gemini)
    {
        await response.WriteAsync((await gemini.Models.GenerateContentAsync(model: "gemini-2.5-flash", contents: "q")).Text);
    }
}

// A Razor Page, Blazor components, and the Razor copy of a .razor file.
public class OutputModel : PageModel
{
    public object? Output { get; set; }

    public async Task OnPostAsync(Client gemini)
    {
        Output = (await gemini.Models.GenerateContentAsync(model: "gemini-2.5-flash", contents: "q")).Text;
    }
}

public class Panel : ComponentBase
{
    private object? shown;

    private async Task Show(Client gemini)
    {
        shown = (await gemini.Models.GenerateContentAsync(model: "gemini-2.5-flash", contents: "q")).Text;
    }
}

public class OwnedPanel : OwningComponentBase
{
    private object? shown;

    private async Task Show(Client gemini)
    {
        shown = (await gemini.Models.GenerateContentAsync(model: "gemini-2.5-flash", contents: "q")).Text;
    }
}

public class Shell : LayoutComponentBase
{
    private object? banner;

    private async Task Show(Client gemini)
    {
        banner = (await gemini.Models.GenerateContentAsync(model: "gemini-2.5-flash", contents: "q")).Text;
    }
}

public class Feed : ComponentBase
{
    private readonly List<object> items = [];

    private async Task Show(Client gemini)
    {
        items.Add((await gemini.Models.GenerateContentAsync(model: "gemini-2.5-flash", contents: "q")).Text);
    }
}

class __RazorCode
{
    object? shown;

    async Task Show(Client gemini)
    {
        shown = (await gemini.Models.GenerateContentAsync(model: "gemini-2.5-flash", contents: "q")).Text;
    }
}

// SignalR: a hub on the app's own base hub, a hub context, and a strongly typed hub.
public class RelayHub : AppHubBase
{
    public async Task All(Client gemini)
    {
        await Clients.All.SendAsync("output", (await gemini.Models.GenerateContentAsync(model: "gemini-2.5-flash", contents: "q")).Text);
    }

    public async Task Group(Client gemini)
    {
        await Clients.Group("room").SendAsync("output", (await gemini.Models.GenerateContentAsync(model: "gemini-2.5-flash", contents: "q")).Text);
    }
}

public class Notifier(IHubContext<RelayHub> hub)
{
    public async Task All(Client gemini)
    {
        await hub.Clients.All.SendAsync("output", (await gemini.Models.GenerateContentAsync(model: "gemini-2.5-flash", contents: "q")).Text);
    }

    public async Task Group(Client gemini)
    {
        await hub.Clients.Group("room").SendAsync("output", (await gemini.Models.GenerateContentAsync(model: "gemini-2.5-flash", contents: "q")).Text);
    }
}

public interface IOutputClient
{
    Task Show(object output);
}

public class OutputHub : Hub<IOutputClient>
{
    public async Task Caller(Client gemini)
    {
        await Clients.Caller.Show((await gemini.Models.GenerateContentAsync(model: "gemini-2.5-flash", contents: "q")).Text);
    }

    public async Task One(Client gemini)
    {
        await Clients.Client("connection").Show((await gemini.Models.GenerateContentAsync(model: "gemini-2.5-flash", contents: "q")).Text);
    }

    public async Task<object> Returned(Client gemini)
    {
        return (await gemini.Models.GenerateContentAsync(model: "gemini-2.5-flash", contents: "q")).Text;
    }

    public async IAsyncEnumerable<object> Streamed(Client gemini)
    {
        var output = (await gemini.Models.GenerateContentAsync(model: "gemini-2.5-flash", contents: "q")).Text;
        yield return output;
    }
}

// .NET MAUI pages.
public class OutputPage : ContentPage
{
    private readonly Label label = new();

    private async void Show(Client gemini)
    {
        label.Text = (await gemini.Models.GenerateContentAsync(model: "gemini-2.5-flash", contents: "q")).Text;
    }
}

public class AliasedPage : Mc.ContentPage
{
    private readonly Label label = new();

    private async void Show(Client gemini)
    {
        label.Text = (await gemini.Models.GenerateContentAsync(model: "gemini-2.5-flash", contents: "q")).Text;
    }
}
