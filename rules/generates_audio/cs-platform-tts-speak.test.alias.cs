// lexcode-expect: 2
// .NET MAUI's TextToSpeech reached through an alias of Microsoft.Maui.Media: the static default
// instance, and an injected ITextToSpeech.
using Media = Microsoft.Maui.Media;

namespace Demo.App;

public class ChapterPage : ContentPage
{
    private readonly Media.ITextToSpeech _tts;

    public ChapterPage(Media.ITextToSpeech tts)
    {
        _tts = tts;
    }

    private async void OnRead(object sender, EventArgs e)
    {
        await Media.TextToSpeech.Default.SpeakAsync("Chapter four");
        await _tts.SpeakAsync("Chapter five");
    }
}
