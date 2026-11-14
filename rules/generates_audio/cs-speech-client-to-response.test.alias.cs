// lexcode-expect: 5
// Every source branch whose library type can be aliased, reached through the alias.
// Generated with the rule's branches (#13012 fix round 1): one action per source branch,
// each sending what the source produced back as the response.
using AAAO2 = Azure.AI.OpenAI;
using AGCTV3 = Google.Cloud.TextToSpeech.V1;
using AO1 = OpenAI;
using Microsoft.AspNetCore.Mvc;

namespace Demo.Generated;

public record Summary(string Body);

public class SourcesController : ControllerBase
{
    // (OpenAI.OpenAIClient $C).GetAudioClient(...)
    public async Task<IActionResult> Case1(AO1.OpenAIClient client)
    {
        var made = client.GetAudioClient("model");
        var r = await made.GenerateSpeechAsync("q");
        return Ok(r);
    }

    // (Azure.AI.OpenAI.AzureOpenAIClient $C).GetAudioClient(...)
    public async Task<IActionResult> Case2(AAAO2.AzureOpenAIClient client)
    {
        var made = client.GetAudioClient("model");
        var r = await made.GenerateSpeechAsync("q");
        return Ok(r);
    }

    // $SP.GetRequiredService<Microsoft.SemanticKernel.TextToAudio.ITextToAudioService>(...)
    public async Task<IActionResult> Case3(IServiceProvider services)
    {
        var made = services.GetRequiredService<Microsoft.SemanticKernel.TextToAudio.ITextToAudioService>();
        var r = await made.GetAudioContentAsync("q");
        return Ok(r);
    }

    // Google.Cloud.TextToSpeech.V1.TextToSpeechClient.Create(...)
    public async Task<IActionResult> Case4(string q)
    {
        var made = AGCTV3.TextToSpeechClient.Create();
        var r = await made.SynthesizeSpeechAsync(q);
        return Ok(r);
    }

    // Google.Cloud.TextToSpeech.V1.TextToSpeechClient.CreateAsync(...)
    public async Task<IActionResult> Case5(string q)
    {
        var made = await AGCTV3.TextToSpeechClient.CreateAsync();
        var r = await made.SynthesizeSpeechAsync(q);
        return Ok(r);
    }
}
