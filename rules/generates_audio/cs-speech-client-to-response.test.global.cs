// lexcode-expect: 2
// No using at all: only the vendor-named short forms can match, as in a file whose
// usings are global ones in another file.
// One action per source branch, each sending what the source produced back as the
// response.
using Microsoft.AspNetCore.Mvc;

namespace Demo.Generated;

public record Summary(string Body);

public class SourcesController : ControllerBase
{
    // (OpenAI.OpenAIClient $C).GetAudioClient(...)
    public async Task<IActionResult> Case1(OpenAIClient client)
    {
        var made = client.GetAudioClient("model");
        var r = await made.GenerateSpeechAsync("q");
        return Ok(r);
    }

    // (Azure.AI.OpenAI.AzureOpenAIClient $C).GetAudioClient(...)
    public async Task<IActionResult> Case2(AzureOpenAIClient client)
    {
        var made = client.GetAudioClient("model");
        var r = await made.GenerateSpeechAsync("q");
        return Ok(r);
    }
}
