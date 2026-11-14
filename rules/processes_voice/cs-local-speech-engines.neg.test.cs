// lexcode-expect: 0
// Speech made from typed text on the device (System.Speech's synthesizer, .NET MAUI's TextToSpeech), a
// speech-to-text permission check that listens to nothing, and look-alikes: the app's own
// SpeechRecognizer and WhisperFactory in another namespace.
using CommunityToolkit.Maui.Media;
using Contoso.Dictation;
using Microsoft.Maui.Media;
using Synthesis = System.Speech.Synthesis;

namespace Contoso.Accessibility;

public sealed class ReadAloudPage(ISpeechToText speechToText)
{
    public async Task ReadAsync(string typedText, CancellationToken token)
    {
        using var synthesizer = new Synthesis.SpeechSynthesizer();
        synthesizer.Speak(typedText);
        await TextToSpeech.Default.SpeakAsync(typedText, cancelToken: token);
        var allowed = await speechToText.RequestPermissions(token);
    }

    public string Local(string path)
    {
        var recognizer = new SpeechRecognizer(path);
        using var factory = WhisperFactory.FromPath(path);
        return recognizer.Name + factory.Name;
    }
}
