// lexcode-expect: 2
// Controllers marked [ApiController] and [Controller] in a file with no Microsoft.AspNetCore.Mvc
// using (it is a global using elsewhere): the short attribute forms.
using Google.GenAI;

namespace Demo.Sinks;

[ApiController]
public class GlobalApi
{
    public async Task<object> Get(Client veo)
    {
        return (await veo.Models.GenerateVideosAsync(model: "veo-3.0-generate-001", prompt: "q")).Name;
    }
}

[Controller]
public class GlobalMvc
{
    public async Task<object> Get(Client veo)
    {
        return (await veo.Models.GenerateVideosAsync(model: "veo-3.0-generate-001", prompt: "q")).Name;
    }
}
