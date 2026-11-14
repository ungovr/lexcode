// lexcode-expect: 2
// Controllers marked [ApiController] and [Controller] in a file with no Microsoft.AspNetCore.Mvc
// using (it is a global using elsewhere): the short attribute forms. Generated with the rule's
// branches (#13012 fix round 1).
using OpenAI.Audio;

namespace Demo.Sinks;

[ApiController]
public class GlobalApi
{
    public async Task<object> Get(AudioClient voice)
    {
        return (await voice.GenerateSpeechAsync("q", GeneratedSpeechVoice.Alloy)).Value;
    }
}

[Controller]
public class GlobalMvc
{
    public async Task<object> Get(AudioClient voice)
    {
        return (await voice.GenerateSpeechAsync("q", GeneratedSpeechVoice.Alloy)).Value;
    }
}
