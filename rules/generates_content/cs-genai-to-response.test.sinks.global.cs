// lexcode-expect: 2
// Controllers marked [ApiController] and [Controller] in a file with no Microsoft.AspNetCore.Mvc
// using (it is a global using elsewhere): the short attribute forms.
using Google.GenAI;

namespace Demo.Sinks;

[ApiController]
public class GlobalApi
{
    public async Task<object> Get(Client gemini)
    {
        return (await gemini.Models.GenerateContentAsync(model: "gemini-2.5-flash", contents: "q")).Text;
    }
}

[Controller]
public class GlobalMvc
{
    public async Task<object> Get(Client gemini)
    {
        return (await gemini.Models.GenerateContentAsync(model: "gemini-2.5-flash", contents: "q")).Text;
    }
}
