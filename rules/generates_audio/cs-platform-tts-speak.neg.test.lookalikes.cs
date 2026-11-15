// lexcode-expect: 0
// The platform speech APIs that read nothing aloud: the locales and voices on offer, listed for a
// settings screen, and System.Speech recognizing what a person said (processes_voice, not this).
using System.Speech.Recognition;
using System.Speech.Synthesis;

namespace Demo.App;

public class VoiceSettingsPage : ContentPage
{
    private readonly Label _summary = new();

    private async void OnAppearing(object sender, EventArgs e)
    {
        var locales = await TextToSpeech.Default.GetLocalesAsync();
        var installed = new SpeechSynthesizer().GetInstalledVoices();
        _summary.Text = $"{locales.Count()} locales, {installed.Count} voices";
    }

    private void OnListen(object sender, EventArgs e)
    {
        using var engine = new SpeechRecognitionEngine();
        engine.LoadGrammar(new DictationGrammar());
        engine.SetInputToDefaultAudioDevice();
        var heard = engine.Recognize();
        _summary.Text = heard?.Text ?? "";
    }
}
