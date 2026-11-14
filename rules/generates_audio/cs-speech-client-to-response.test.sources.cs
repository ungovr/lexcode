// lexcode-expect: 5
// Every source branch, its library imported with a using line.
// One action per source branch, each sending what the source produced back as the
// response.
using Azure.AI.OpenAI;
using Google.Cloud.TextToSpeech.V1;
using Microsoft.AspNetCore.Mvc;
using Microsoft.SemanticKernel.TextToAudio;
using OpenAI;

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

    // $SP.GetRequiredService<Microsoft.SemanticKernel.TextToAudio.ITextToAudioService>(...)
    public async Task<IActionResult> Case3(IServiceProvider services)
    {
        var made = services.GetRequiredService<ITextToAudioService>();
        var r = await made.GetAudioContentAsync("q");
        return Ok(r);
    }

    // Google.Cloud.TextToSpeech.V1.TextToSpeechClient.Create(...)
    public async Task<IActionResult> Case4(string q)
    {
        var made = TextToSpeechClient.Create();
        var r = await made.SynthesizeSpeechAsync(q);
        return Ok(r);
    }

    // Google.Cloud.TextToSpeech.V1.TextToSpeechClient.CreateAsync(...)
    public async Task<IActionResult> Case5(string q)
    {
        var made = await TextToSpeechClient.CreateAsync();
        var r = await made.SynthesizeSpeechAsync(q);
        return Ok(r);
    }
}
