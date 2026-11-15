// lexcode-expect: 0
// The speech SDKs' lookalikes that make no sound: Azure AI Speech recognizing what a person said
// (recording and analyzing voices is processes_voice, not this), the voices a synthesizer offers,
// and System.Speech's recognizer on a desktop host.
using Microsoft.AspNetCore.Mvc;
using Microsoft.CognitiveServices.Speech;
using Microsoft.CognitiveServices.Speech.Audio;
using System.Speech.Recognition;

namespace Demo.Web;

public class DictationController(SpeechConfig config) : ControllerBase
{
    // The person's own words, recognized and sent back as text.
    [HttpPost("dictate")]
    public async Task<IActionResult> Dictate(string wavPath)
    {
        using var input = AudioConfig.FromWavFileInput(wavPath);
        using var recognizer = new SpeechRecognizer(config, input);
        var result = await recognizer.RecognizeOnceAsync();
        return Ok(result.Text);
    }

    // The voices Azure AI Speech offers, for a settings page: nothing is spoken.
    [HttpGet("azure-voices")]
    public async Task<IActionResult> Voices()
    {
        using var synthesizer = new SpeechSynthesizer(config, null);
        var voices = await synthesizer.GetVoicesAsync();
        return Ok(voices.Voices.Select(v => v.ShortName));
    }

    // System.Speech recognition of a recorded command.
    [HttpPost("command")]
    public IActionResult Command(string wavPath)
    {
        using var engine = new SpeechRecognitionEngine();
        engine.LoadGrammar(new DictationGrammar());
        engine.SetInputToWaveFile(wavPath);
        var heard = engine.Recognize();
        return Ok(heard?.Text);
    }
}
