// lexcode-expect: 3
// A speech client taken into a local, where the engine cannot type it, and followed to the
// response: from the OpenAI client, and a Google Cloud Text-to-Speech client created in a minimal
// API handler and in a controller.
using Google.Cloud.TextToSpeech.V1;
using Microsoft.AspNetCore.Mvc;
using OpenAI;
using OpenAI.Audio;

namespace Demo.Web;

public class NarratorController : ControllerBase
{
    [HttpPost("factory")]
    public async Task<IActionResult> Factory(string text, OpenAIClient openAi)
    {
        var audio = openAi.GetAudioClient("tts-1");
        var speech = await audio.GenerateSpeechAsync(text, GeneratedSpeechVoice.Echo);
        return File(speech.Value.ToStream(), "audio/mpeg");
    }

    [HttpPost("google")]
    public IActionResult Google(string text)
    {
        var client = TextToSpeechClient.Create();
        var response = client.SynthesizeSpeech(new SynthesizeSpeechRequest { Input = new SynthesisInput { Text = text } });
        return File(response.AudioContent.ToByteArray(), "audio/mpeg");
    }
}

public static class NarratorEndpoints
{
    public static void Map(WebApplication app)
    {
        app.MapPost("/google", async (string text) =>
        {
            var client = await TextToSpeechClient.CreateAsync();
            var response = await client.SynthesizeSpeechAsync(new SynthesizeSpeechRequest { Input = new SynthesisInput { Text = text } });
            return Results.File(response.AudioContent.ToByteArray(), "audio/mpeg");
        });
    }
}
