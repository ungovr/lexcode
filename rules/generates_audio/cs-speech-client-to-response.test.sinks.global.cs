// lexcode-expect: 2
// Controllers marked [ApiController] and [Controller] in a file with no Microsoft.AspNetCore.Mvc
// using (it is a global using elsewhere): the short attribute forms. Generated with the rule's
// branches (#13012 fix round 1).
using OpenAI;

namespace Demo.Sinks;

[ApiController]
public class GlobalApi
{
    public async Task<object> Get(OpenAIClient openAi)
    {
        return (await openAi.GetAudioClient("tts-1").GenerateSpeechAsync("q", OpenAI.Audio.GeneratedSpeechVoice.Alloy)).Value;
    }
}

[Controller]
public class GlobalMvc
{
    public async Task<object> Get(OpenAIClient openAi)
    {
        return (await openAi.GetAudioClient("tts-1").GenerateSpeechAsync("q", OpenAI.Audio.GeneratedSpeechVoice.Alloy)).Value;
    }
}
