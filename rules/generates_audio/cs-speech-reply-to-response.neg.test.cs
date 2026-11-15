// lexcode-expect: 0
// A person's recording transcribed on the same audio client, a recording only played back, the
// voices a speech service offers, the configured voice model, and app classes that share the
// speech SDKs' short names.
using Amazon.Polly;
using Amazon.Polly.Model;
using Demo.Media;
using Google.Cloud.TextToSpeech.V1;
using Microsoft.AspNetCore.Mvc;
using OpenAI;

namespace Demo.Web;

public class VoiceController(IAmazonPolly polly) : ControllerBase
{
    // Transcription reads the person's recording; it makes no sound.
    [HttpPost("transcribe")]
    public async Task<IActionResult> Transcribe(IFormFile upload, OpenAIClient openAi)
    {
        var audio = openAi.GetAudioClient("whisper-1");
        var transcription = await audio.TranscribeAudioAsync(upload.OpenReadStream(), upload.FileName);
        return Ok(transcription.Value.Text);
    }

    // The person's own voicemail, played back.
    [HttpGet("voicemail/{id}")]
    public IActionResult Voicemail(string id)
    {
        return PhysicalFile($"/srv/voicemail/{id}.mp3", "audio/mpeg");
    }

    // The voices on offer, listed for a settings page.
    [HttpGet("voices")]
    public async Task<IActionResult> Voices()
    {
        var google = TextToSpeechClient.Create();
        var voices = google.ListVoices(new ListVoicesRequest());
        var pollyVoices = await polly.DescribeVoicesAsync(new DescribeVoicesRequest());
        return Ok(voices.Voices.Count + pollyVoices.Voices.Count);
    }

    // Which voice model is configured; nothing is spoken.
    [HttpGet("voice-model")]
    public IActionResult VoiceModel(OpenAIClient openAi)
    {
        var audio = openAi.GetAudioClient("tts-1");
        return Ok(audio.Model);
    }

    // The app's own AudioClient and SpeechSynthesizer, in Demo.Media, play stored announcements.
    [HttpGet("announcement")]
    public async Task<IActionResult> Announcement(string name)
    {
        var library = new AudioClient("announcements");
        var clip = await library.GenerateSpeechAsync(name);
        var synthesizer = new SpeechSynthesizer();
        var chime = await synthesizer.SpeakTextAsync("chime");
        return File(clip.Concat(chime).ToArray(), "audio/mpeg");
    }
}
