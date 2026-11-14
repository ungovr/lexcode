// lexcode-expect: 0
// What the rule does not count, each sent straight back as the response: a client's or
// request's metadata, a null check, and the calls on the same object that generate nothing.
// Removing any one of the rule's sanitizers makes its case match. The is-not-null check
// goes to ViewBag: inside Ok(...) the engine carries no taint through an is pattern.
using Google.Cloud.TextToSpeech.V1;
using Microsoft.AspNetCore.Mvc;
using OpenAI;

namespace Demo.Generated;

public class MetadataController : Controller
{
    // $C.Model
    public async Task<IActionResult> Case1(OpenAIClient openAi, IFormFile upload)
    {
        var audio = openAi.GetAudioClient("tts-1");
        return Ok(audio.Model);
    }

    // $C is not null
    public async Task<IActionResult> Case2(OpenAIClient openAi, IFormFile upload)
    {
        var audio = openAi.GetAudioClient("tts-1");
        ViewBag.Ready = audio is not null;
        return Ok();
    }

    // $C != null
    public async Task<IActionResult> Case3(OpenAIClient openAi, IFormFile upload)
    {
        var audio = openAi.GetAudioClient("tts-1");
        return Ok(audio != null);
    }

    // $A.TranscribeAudio(...)
    public async Task<IActionResult> Case4(OpenAIClient openAi, IFormFile upload)
    {
        var audio = openAi.GetAudioClient("whisper-1");
        return Ok(audio.TranscribeAudio(upload.OpenReadStream(), upload.FileName).Value.Text);
    }

    // $A.TranscribeAudioAsync(...)
    public async Task<IActionResult> Case5(OpenAIClient openAi, IFormFile upload)
    {
        var audio = openAi.GetAudioClient("whisper-1");
        return Ok((await audio.TranscribeAudioAsync(upload.OpenReadStream(), upload.FileName)).Value.Text);
    }

    // $A.TranslateAudio(...)
    public async Task<IActionResult> Case6(OpenAIClient openAi, IFormFile upload)
    {
        var audio = openAi.GetAudioClient("whisper-1");
        return Ok(audio.TranslateAudio(upload.OpenReadStream(), upload.FileName).Value.Text);
    }

    // $A.TranslateAudioAsync(...)
    public async Task<IActionResult> Case7(OpenAIClient openAi, IFormFile upload)
    {
        var audio = openAi.GetAudioClient("whisper-1");
        return Ok((await audio.TranslateAudioAsync(upload.OpenReadStream(), upload.FileName)).Value.Text);
    }

    // $C.ListVoices(...)
    public async Task<IActionResult> Case8(OpenAIClient openAi, IFormFile upload)
    {
        var google = TextToSpeechClient.Create();
        return Ok(google.ListVoices(new ListVoicesRequest()).Voices.Count);
    }

    // $C.ListVoicesAsync(...)
    public async Task<IActionResult> Case9(OpenAIClient openAi, IFormFile upload)
    {
        var google = await TextToSpeechClient.CreateAsync();
        return Ok((await google.ListVoicesAsync(new ListVoicesRequest())).Voices.Count);
    }
}
