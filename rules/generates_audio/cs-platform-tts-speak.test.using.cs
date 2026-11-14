// lexcode-expect: 2
// .NET MAUI's TextToSpeech with Microsoft.Maui.Media imported by a using line: the static default
// instance, and an ITextToSpeech held in a primary-constructor parameter.
using Microsoft.Maui.Media;

namespace Demo.App;

public class AnnouncerPage(ITextToSpeech tts) : ContentPage
{
    private async void OnAnnounce(object sender, EventArgs e)
    {
        await TextToSpeech.Default.SpeakAsync("Your order is ready");
        await tts.SpeakAsync("Table four");
    }
}
