// lexcode-expect: 12
// Every source branch whose library type can be aliased, reached through the alias.
// One action per source branch, each sending what the source produced back as the
// response.
using AAP4 = Amazon.Polly;
using AGCTV5 = Google.Cloud.TextToSpeech.V1;
using AMCS3 = Microsoft.CognitiveServices.Speech;
using AMST2 = Microsoft.SemanticKernel.TextToAudio;
using AOA1 = OpenAI.Audio;
using Microsoft.AspNetCore.Mvc;

namespace Demo.Generated;

public record Summary(string Body);

public class SourcesController : ControllerBase
{
    // (OpenAI.Audio.AudioClient $C).GenerateSpeech(...)
    public async Task<IActionResult> Case1(AOA1.AudioClient client)
    {
        var r = await client.GenerateSpeech("q");
        return Ok(r);
    }

    // (OpenAI.Audio.AudioClient $C).GenerateSpeechAsync(...)
    public async Task<IActionResult> Case2(AOA1.AudioClient client)
    {
        var r = await client.GenerateSpeechAsync("q");
        return Ok(r);
    }

    // (Microsoft.SemanticKernel.TextToAudio.ITextToAudioService $C).GetAudioContentAsync(...)
    public async Task<IActionResult> Case3(AMST2.ITextToAudioService client)
    {
        var r = await client.GetAudioContentAsync("q");
        return Ok(r);
    }

    // (Microsoft.SemanticKernel.TextToAudio.ITextToAudioService $C).GetAudioContentsAsync(...)
    public async Task<IActionResult> Case4(AMST2.ITextToAudioService client)
    {
        var r = await client.GetAudioContentsAsync("q");
        return Ok(r);
    }

    // (Microsoft.CognitiveServices.Speech.SpeechSynthesizer $C).SpeakTextAsync(...)
    public async Task<IActionResult> Case5(AMCS3.SpeechSynthesizer client)
    {
        var r = await client.SpeakTextAsync("q");
        return Ok(r);
    }

    // (Microsoft.CognitiveServices.Speech.SpeechSynthesizer $C).SpeakSsmlAsync(...)
    public async Task<IActionResult> Case6(AMCS3.SpeechSynthesizer client)
    {
        var r = await client.SpeakSsmlAsync("q");
        return Ok(r);
    }

    // (Microsoft.CognitiveServices.Speech.SpeechSynthesizer $C).StartSpeakingTextAsync(...)
    public async Task<IActionResult> Case7(AMCS3.SpeechSynthesizer client)
    {
        var r = await client.StartSpeakingTextAsync("q");
        return Ok(r);
    }

    // (Microsoft.CognitiveServices.Speech.SpeechSynthesizer $C).StartSpeakingSsmlAsync(...)
    public async Task<IActionResult> Case8(AMCS3.SpeechSynthesizer client)
    {
        var r = await client.StartSpeakingSsmlAsync("q");
        return Ok(r);
    }

    // (Amazon.Polly.IAmazonPolly $C).SynthesizeSpeechAsync(...)
    public async Task<IActionResult> Case9(AAP4.IAmazonPolly client)
    {
        var r = await client.SynthesizeSpeechAsync("q");
        return Ok(r);
    }

    // (Amazon.Polly.AmazonPollyClient $C).SynthesizeSpeechAsync(...)
    public async Task<IActionResult> Case10(AAP4.AmazonPollyClient client)
    {
        var r = await client.SynthesizeSpeechAsync("q");
        return Ok(r);
    }

    // (Google.Cloud.TextToSpeech.V1.TextToSpeechClient $C).SynthesizeSpeech(...)
    public async Task<IActionResult> Case11(AGCTV5.TextToSpeechClient client)
    {
        var r = await client.SynthesizeSpeech("q");
        return Ok(r);
    }

    // (Google.Cloud.TextToSpeech.V1.TextToSpeechClient $C).SynthesizeSpeechAsync(...)
    public async Task<IActionResult> Case12(AGCTV5.TextToSpeechClient client)
    {
        var r = await client.SynthesizeSpeechAsync("q");
        return Ok(r);
    }
}
