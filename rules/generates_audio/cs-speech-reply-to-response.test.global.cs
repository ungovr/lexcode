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
    // (Amazon.Polly.IAmazonPolly $C).SynthesizeSpeechAsync(...)
    public async Task<IActionResult> Case1(IAmazonPolly client)
    {
        var r = await client.SynthesizeSpeechAsync("q");
        return Ok(r);
    }

    // (Amazon.Polly.AmazonPollyClient $C).SynthesizeSpeechAsync(...)
    public async Task<IActionResult> Case2(AmazonPollyClient client)
    {
        var r = await client.SynthesizeSpeechAsync("q");
        return Ok(r);
    }
}
