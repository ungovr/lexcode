// lexcode-expect: 52
// Every sink and propagator branch of the rule, each reached alone, with the rule's own source.
// Microsoft.AspNetCore.Http, System.IO and Microsoft.Maui.Controls are not imported (they are
// implicit), so a short form and its aliased qualified form each have a case of their own.
using OpenAI.Images;
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
    public async Task<IActionResult> Returned(ImageClient images)
    {
        var output = (await images.GenerateImageAsync("q")).Value.ImageBytes;
        return Ok(output);
    }

    // Streamed with yield return.
    public async IAsyncEnumerable<object> Streamed(ImageClient images)
    {
        var output = (await images.GenerateImageAsync("q")).Value.ImageBytes;
        yield return output;
    }

    // An expression body.
    public async Task<object> Expression(ImageClient images) => (await images.GenerateImageAsync("q")).Value.ImageBytes;

    // The response body, written from the action.
    public async Task Written(ImageClient images)
    {
        await Response.WriteAsync((await images.GenerateImageAsync("q")).Value.ImageBytes);
    }

    public async Task WrittenToBody(ImageClient images)
    {
        await Response.Body.WriteAsync((await images.GenerateImageAsync("q")).Value.ImageBytes);
    }

    public async Task Copied(ImageClient images)
    {
        var stream = (await images.GenerateImageAsync("q")).Value.ImageBytes;
        await stream.CopyToAsync(Response.Body);
    }

    // View data.
    public async Task Bag(ImageClient images)
    {
        ViewBag.Output = (await images.GenerateImageAsync("q")).Value.ImageBytes;
    }

    public async Task Data(ImageClient images)
    {
        ViewData["output"] = (await images.GenerateImageAsync("q")).Value.ImageBytes;
    }

    public async Task Temp(ImageClient images)
    {
        TempData["output"] = (await images.GenerateImageAsync("q")).Value.ImageBytes;
    }

    // Propagators: written to a file, then the file is the response.
    public async Task<IActionResult> BytesQualified(ImageClient images)
    {
        var path = "/srv/out/1";
        System.IO.File.WriteAllBytes(path, (await images.GenerateImageAsync("q")).Value.ImageBytes);
        return PhysicalFile(path, "application/octet-stream");
    }

    public async Task<IActionResult> Bytes(ImageClient images)
    {
        var path = "/srv/out/2";
        File.WriteAllBytes(path, (await images.GenerateImageAsync("q")).Value.ImageBytes);
        return PhysicalFile(path, "application/octet-stream");
    }

    public async Task<IActionResult> BytesAsyncQualified(ImageClient images)
    {
        var path = "/srv/out/3";
        await System.IO.File.WriteAllBytesAsync(path, (await images.GenerateImageAsync("q")).Value.ImageBytes);
        return PhysicalFile(path, "application/octet-stream");
    }

    public async Task<IActionResult> BytesAsync(ImageClient images)
    {
        var path = "/srv/out/4";
        await File.WriteAllBytesAsync(path, (await images.GenerateImageAsync("q")).Value.ImageBytes);
        return PhysicalFile(path, "application/octet-stream");
    }

    public async Task<IActionResult> TextQualified(ImageClient images)
    {
        var path = "/srv/out/5";
        System.IO.File.WriteAllText(path, (await images.GenerateImageAsync("q")).Value.ImageBytes);
        return PhysicalFile(path, "text/plain");
    }

    public async Task<IActionResult> Text(ImageClient images)
    {
        var path = "/srv/out/6";
        File.WriteAllText(path, (await images.GenerateImageAsync("q")).Value.ImageBytes);
        return PhysicalFile(path, "text/plain");
    }

    public async Task<IActionResult> TextAsyncQualified(ImageClient images)
    {
        var path = "/srv/out/7";
        await System.IO.File.WriteAllTextAsync(path, (await images.GenerateImageAsync("q")).Value.ImageBytes);
        return PhysicalFile(path, "text/plain");
    }

    public async Task<IActionResult> TextAsync(ImageClient images)
    {
        var path = "/srv/out/8";
        await File.WriteAllTextAsync(path, (await images.GenerateImageAsync("q")).Value.ImageBytes);
        return PhysicalFile(path, "text/plain");
    }

    // Propagators: copied into a stream, gathered into a builder or a list.
    public async Task<IActionResult> CopiedToMemory(ImageClient images)
    {
        var stream = (await images.GenerateImageAsync("q")).Value.ImageBytes;
        var memory = new MemoryStream();
        await stream.CopyToAsync(memory);
        return Ok(memory);
    }

    public async Task<IActionResult> Built(ImageClient images)
    {
        var text = new StringBuilder();
        text.Append((await images.GenerateImageAsync("q")).Value.ImageBytes);
        return Ok(text.ToString());
    }

    public async Task<IActionResult> Listed(ImageClient images)
    {
        var items = new List<object>();
        items.Add((await images.GenerateImageAsync("q")).Value.ImageBytes);
        return Ok(items);
    }

    public async Task<IActionResult> ListedRange(ImageClient images)
    {
        var items = new List<object>();
        items.AddRange((await images.GenerateImageAsync("q")).Value.ImageBytes);
        return Ok(items);
    }
}

// Controllers marked by attribute, whatever their name: short, qualified, and with a base of the
// app's own.
[ApiController]
[Route("api/marked")]
public class MarkedApi
{
    public async Task<object> Get(ImageClient images)
    {
        return (await images.GenerateImageAsync("q")).Value.ImageBytes;
    }
}

[Microsoft.AspNetCore.Mvc.ApiController]
public class QualifiedApi : AppEndpointBase
{
    public async Task<object> Get(ImageClient images)
    {
        return (await images.GenerateImageAsync("q")).Value.ImageBytes;
    }
}

[Controller]
public class MarkedMvc
{
    public async Task<object> Get(ImageClient images)
    {
        return (await images.GenerateImageAsync("q")).Value.ImageBytes;
    }
}

[Microsoft.AspNetCore.Mvc.Controller]
public class QualifiedMvc
{
    public async Task<object> Get(ImageClient images)
    {
        return (await images.GenerateImageAsync("q")).Value.ImageBytes;
    }
}

// Minimal API handlers, a Results helper outside them, and response writes from middleware.
public static class Endpoints
{
    public static void Map(WebApplication app)
    {
        app.MapPost("/block", async (ImageClient images) =>
        {
            var output = (await images.GenerateImageAsync("q")).Value.ImageBytes;
            return output;
        });
        app.MapGet("/expression", async (ImageClient images) => (await images.GenerateImageAsync("q")).Value.ImageBytes);
    }

    public static async Task<IResult> Ok1(ImageClient images)
    {
        var output = (await images.GenerateImageAsync("q")).Value.ImageBytes;
        return Results.Ok(output);
    }

    public static async Task<IResult> Ok2(ImageClient images)
    {
        var output = (await images.GenerateImageAsync("q")).Value.ImageBytes;
        return TypedResults.Ok(output);
    }

    public static async Task<IResult> Ok3(ImageClient images)
    {
        var output = (await images.GenerateImageAsync("q")).Value.ImageBytes;
        return Http.Results.Ok(output);
    }

    public static async Task<IResult> Ok4(ImageClient images)
    {
        var output = (await images.GenerateImageAsync("q")).Value.ImageBytes;
        return Http.TypedResults.Ok(output);
    }

    public static async Task Middleware(HttpContext context, ImageClient images)
    {
        await context.Response.WriteAsync((await images.GenerateImageAsync("q")).Value.ImageBytes);
    }

    public static async Task MiddlewareBody(HttpContext context, ImageClient images)
    {
        await context.Response.Body.WriteAsync((await images.GenerateImageAsync("q")).Value.ImageBytes);
    }

    public static async Task MiddlewareCopy(HttpContext context, ImageClient images)
    {
        var stream = (await images.GenerateImageAsync("q")).Value.ImageBytes;
        await stream.CopyToAsync(context.Response.Body);
    }

    public static async Task TypedQualified(Http.HttpResponse response, ImageClient images)
    {
        await response.WriteAsync((await images.GenerateImageAsync("q")).Value.ImageBytes);
    }

    public static async Task Typed(HttpResponse response, ImageClient images)
    {
        await response.WriteAsync((await images.GenerateImageAsync("q")).Value.ImageBytes);
    }
}

// A Razor Page, Blazor components, and the Razor copy of a .razor file.
public class OutputModel : PageModel
{
    public object? Output { get; set; }

    public async Task OnPostAsync(ImageClient images)
    {
        Output = (await images.GenerateImageAsync("q")).Value.ImageBytes;
    }
}

public class Panel : ComponentBase
{
    private object? shown;

    private async Task Show(ImageClient images)
    {
        shown = (await images.GenerateImageAsync("q")).Value.ImageBytes;
    }
}

public class OwnedPanel : OwningComponentBase
{
    private object? shown;

    private async Task Show(ImageClient images)
    {
        shown = (await images.GenerateImageAsync("q")).Value.ImageBytes;
    }
}

public class Shell : LayoutComponentBase
{
    private object? banner;

    private async Task Show(ImageClient images)
    {
        banner = (await images.GenerateImageAsync("q")).Value.ImageBytes;
    }
}

public class Feed : ComponentBase
{
    private readonly List<object> items = [];

    private async Task Show(ImageClient images)
    {
        items.Add((await images.GenerateImageAsync("q")).Value.ImageBytes);
    }
}

class __RazorCode
{
    object? shown;

    async Task Show(ImageClient images)
    {
        shown = (await images.GenerateImageAsync("q")).Value.ImageBytes;
    }
}

// SignalR: a hub on the app's own base hub, a hub context, and a strongly typed hub.
public class RelayHub : AppHubBase
{
    public async Task All(ImageClient images)
    {
        await Clients.All.SendAsync("output", (await images.GenerateImageAsync("q")).Value.ImageBytes);
    }

    public async Task Group(ImageClient images)
    {
        await Clients.Group("room").SendAsync("output", (await images.GenerateImageAsync("q")).Value.ImageBytes);
    }
}

public class Notifier(IHubContext<RelayHub> hub)
{
    public async Task All(ImageClient images)
    {
        await hub.Clients.All.SendAsync("output", (await images.GenerateImageAsync("q")).Value.ImageBytes);
    }

    public async Task Group(ImageClient images)
    {
        await hub.Clients.Group("room").SendAsync("output", (await images.GenerateImageAsync("q")).Value.ImageBytes);
    }
}

public interface IOutputClient
{
    Task Show(object output);
}

public class OutputHub : Hub<IOutputClient>
{
    public async Task Caller(ImageClient images)
    {
        await Clients.Caller.Show((await images.GenerateImageAsync("q")).Value.ImageBytes);
    }

    public async Task One(ImageClient images)
    {
        await Clients.Client("connection").Show((await images.GenerateImageAsync("q")).Value.ImageBytes);
    }

    public async Task<object> Returned(ImageClient images)
    {
        return (await images.GenerateImageAsync("q")).Value.ImageBytes;
    }

    public async IAsyncEnumerable<object> Streamed(ImageClient images)
    {
        var output = (await images.GenerateImageAsync("q")).Value.ImageBytes;
        yield return output;
    }
}

// .NET MAUI pages.
public class OutputPage : ContentPage
{
    private readonly Label label = new();

    private async void Show(ImageClient images)
    {
        label.Text = (await images.GenerateImageAsync("q")).Value.ImageBytes;
    }
}

public class AliasedPage : Mc.ContentPage
{
    private readonly Label label = new();

    private async void Show(ImageClient images)
    {
        label.Text = (await images.GenerateImageAsync("q")).Value.ImageBytes;
    }
}
