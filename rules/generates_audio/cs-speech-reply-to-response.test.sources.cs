// lexcode-expect: 12
// Every source branch, its library imported with a using line.
// One action per source branch, each sending what the source produced back as the
// response.
using Amazon.Polly;
using Google.Cloud.TextToSpeech.V1;
using Microsoft.AspNetCore.Mvc;
using Microsoft.CognitiveServices.Speech;
using Microsoft.SemanticKernel.TextToAudio;
using OpenAI.Audio;

namespace Demo.Generated;

public record Summary(string Body);

public class SourcesController : ControllerBase
{
    // (OpenAI.Audio.AudioClient $C).GenerateSpeech(...)
    public async Task<IActionResult> Case1(AudioClient client)
    {
        var r = await client.GenerateSpeech("q");
        return Ok(r);
    }

    // (OpenAI.Audio.AudioClient $C).GenerateSpeechAsync(...)
    public async Task<IActionResult> Case2(AudioClient client)
    {
        var r = await client.GenerateSpeechAsync("q");
        return Ok(r);
    }

    // (Microsoft.SemanticKernel.TextToAudio.ITextToAudioService $C).GetAudioContentAsync(...)
    public async Task<IActionResult> Case3(ITextToAudioService client)
    {
        var r = await client.GetAudioContentAsync("q");
        return Ok(r);
    }

    // (Microsoft.SemanticKernel.TextToAudio.ITextToAudioService $C).GetAudioContentsAsync(...)
    public async Task<IActionResult> Case4(ITextToAudioService client)
    {
        var r = await client.GetAudioContentsAsync("q");
        return Ok(r);
    }

    // (Microsoft.CognitiveServices.Speech.SpeechSynthesizer $C).SpeakTextAsync(...)
    public async Task<IActionResult> Case5(SpeechSynthesizer client)
    {
        var r = await client.SpeakTextAsync("q");
        return Ok(r);
    }

    // (Microsoft.CognitiveServices.Speech.SpeechSynthesizer $C).SpeakSsmlAsync(...)
    public async Task<IActionResult> Case6(SpeechSynthesizer client)
    {
        var r = await client.SpeakSsmlAsync("q");
        return Ok(r);
    }

    // (Microsoft.CognitiveServices.Speech.SpeechSynthesizer $C).StartSpeakingTextAsync(...)
    public async Task<IActionResult> Case7(SpeechSynthesizer client)
    {
        var r = await client.StartSpeakingTextAsync("q");
        return Ok(r);
    }

    // (Microsoft.CognitiveServices.Speech.SpeechSynthesizer $C).StartSpeakingSsmlAsync(...)
    public async Task<IActionResult> Case8(SpeechSynthesizer client)
    {
        var r = await client.StartSpeakingSsmlAsync("q");
        return Ok(r);
    }

    // (Amazon.Polly.IAmazonPolly $C).SynthesizeSpeechAsync(...)
    public async Task<IActionResult> Case9(IAmazonPolly client)
    {
        var r = await client.SynthesizeSpeechAsync("q");
        return Ok(r);
    }

    // (Amazon.Polly.AmazonPollyClient $C).SynthesizeSpeechAsync(...)
    public async Task<IActionResult> Case10(AmazonPollyClient client)
    {
        var r = await client.SynthesizeSpeechAsync("q");
        return Ok(r);
    }

    // (Google.Cloud.TextToSpeech.V1.TextToSpeechClient $C).SynthesizeSpeech(...)
    public async Task<IActionResult> Case11(TextToSpeechClient client)
    {
        var r = await client.SynthesizeSpeech("q");
        return Ok(r);
    }

    // (Google.Cloud.TextToSpeech.V1.TextToSpeechClient $C).SynthesizeSpeechAsync(...)
    public async Task<IActionResult> Case12(TextToSpeechClient client)
    {
        var r = await client.SynthesizeSpeechAsync("q");
        return Ok(r);
    }
}
