// lexcode-expect: 2
// Controllers marked [ApiController] and [Controller] in a file with no Microsoft.AspNetCore.Mvc
// using (it is a global using elsewhere): the short attribute forms.
using Mscc.GenerativeAI;

namespace Demo.Sinks;

[ApiController]
public class GlobalApi
{
    public async Task<object> Get(GoogleAI googleAI)
    {
        return (await googleAI.GenerativeModel("gemini-2.5-flash").GenerateContent("q")).Text;
    }
}

[Controller]
public class GlobalMvc
{
    public async Task<object> Get(GoogleAI googleAI)
    {
        return (await googleAI.GenerativeModel("gemini-2.5-flash").GenerateContent("q")).Text;
    }
}
