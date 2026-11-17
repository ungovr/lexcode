// lexcode-expect: 1
// The nearest lookalike of the metadata sanitizers: asking the client for a service that is not
// its metadata (here the client itself) and sending that back still counts.
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.AI;

namespace Demo.Generated;

public class LookalikeController : Controller
{
    public async Task<IActionResult> Inner(IServiceProvider services)
    {
        var chat = services.GetRequiredService<IChatClient>();
        return Ok(chat.GetService(typeof(IChatClient)));
    }
}
