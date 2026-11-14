// lexcode-expect: 7
// Speech a text-to-speech model made, sent back to the person who asked: OpenAI through its using
// line, an alias and target-typed new; Semantic Kernel injected; Azure AI Speech; Amazon Polly
// copied to the response; Google Cloud Text-to-Speech injected into a minimal API; and a hub.
using Amazon.Polly;
using Amazon.Polly.Model;
using Google.Cloud.TextToSpeech.V1;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.CognitiveServices.Speech;
using Microsoft.SemanticKernel.TextToAudio;
using OpenAI.Audio;
using Snd = OpenAI.Audio;

namespace Demo.Web;

public class NarratorController(ITextToAudioService textToAudio, AmazonPollyClient polly) : ControllerBase
{
    [HttpPost("narrate")]
    public async Task<IActionResult> Narrate(string text)
    {
        var audio = new AudioClient("gpt-4o-mini-tts", "key");
        BinaryData speech = await audio.GenerateSpeechAsync(text, GeneratedSpeechVoice.Alloy);
        return File(speech.ToArray(), "audio/mpeg");
    }

    [HttpPost("aliased")]
    public async Task<IActionResult> Aliased(string text)
    {
        Snd.AudioClient audio = new("tts-1", "key");
        var speech = await audio.GenerateSpeechAsync(text, GeneratedSpeechVoice.Nova);
        return File(speech.Value.ToArray(), "audio/mpeg");
    }

    [HttpPost("kernel")]
    public async Task<IActionResult> Kernel(string text)
    {
        var content = await textToAudio.GetAudioContentAsync(text);
        return File(content.Data!.Value.ToArray(), "audio/mpeg");
    }

    [HttpPost("azure")]
    public async Task<IActionResult> Azure(string text)
    {
        var config = SpeechConfig.FromSubscription("key", "westeurope");
        using var synthesizer = new SpeechSynthesizer(config, null);
        var result = await synthesizer.SpeakTextAsync(text);
        return File(result.AudioData, "audio/wav");
    }

    [HttpPost("polly")]
    public async Task Polly(string text)
    {
        var response = await polly.SynthesizeSpeechAsync(new SynthesizeSpeechRequest { Text = text, OutputFormat = OutputFormat.Mp3, VoiceId = VoiceId.Joanna });
        Response.ContentType = "audio/mpeg";
        await response.AudioStream.CopyToAsync(Response.Body);
    }
}

public static class NarratorEndpoints
{
    public static void Map(WebApplication app)
    {
        app.MapPost("/google", async (string text, TextToSpeechClient client) =>
        {
            var response = await client.SynthesizeSpeechAsync(new SynthesizeSpeechRequest { Input = new SynthesisInput { Text = text } });
            return Results.File(response.AudioContent.ToByteArray(), "audio/mpeg");
        });
    }
}

public class NarratorHub(IAmazonPolly polly) : Hub
{
    public async Task Speak(string text)
    {
        var response = await polly.SynthesizeSpeechAsync(new SynthesizeSpeechRequest { Text = text });
        var bytes = new MemoryStream();
        await response.AudioStream.CopyToAsync(bytes);
        await Clients.Caller.SendAsync("audio", bytes.ToArray());
    }
}
