// lexcode-expect: 5
// Text read aloud by the platform's text-to-speech engine: .NET MAUI's TextToSpeech (implicitly
// imported, fully qualified, and injected through a constructor parameter) and System.Speech on
// Windows, through its using line and an alias.
using System.Speech.Synthesis;
using Sapi = System.Speech.Synthesis;

namespace Demo.App;

public class ReaderPage : ContentPage
{
    private readonly ITextToSpeech _tts;

    public ReaderPage(ITextToSpeech tts)
    {
        _tts = tts;
    }

    private async void OnRead(object sender, EventArgs e)
    {
        await TextToSpeech.Default.SpeakAsync("Chapter one");
        await Microsoft.Maui.Media.TextToSpeech.Default.SpeakAsync("Chapter two");
        await _tts.SpeakAsync("Chapter three");
    }
}

public class DesktopReader
{
    public void Read(string text)
    {
        var synthesizer = new SpeechSynthesizer();
        synthesizer.Speak(text);
        Sapi.SpeechSynthesizer other = new();
        other.SpeakAsync(text);
    }
}
