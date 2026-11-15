// lexcode-expect: 0
// A recording played back on the device, and an app class that shares System.Speech's
// SpeechSynthesizer short name.
using Demo.Media;
using Plugin.Maui.Audio;

namespace Demo.App;

public class DoorbellPage : ContentPage
{
    private readonly IAudioManager _audio;

    public DoorbellPage(IAudioManager audio)
    {
        _audio = audio;
    }

    // The visitor's own recorded message, played as it was recorded.
    private async void OnPlay(object sender, EventArgs e)
    {
        var player = _audio.CreatePlayer(await FileSystem.OpenAppPackageFileAsync("visitor.wav"));
        player.Play();
    }

    // The app's own SpeechSynthesizer, in Demo.Media, plays a stored chime.
    private void OnChime(object sender, EventArgs e)
    {
        var chime = new SpeechSynthesizer();
        chime.Speak("chime");
    }
}
