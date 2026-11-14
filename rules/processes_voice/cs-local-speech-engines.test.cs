// lexcode-expect: 8
// Recognizing speech inside the app: Whisper.net (imported), Vosk (aliased, and a target-typed field),
// System.Speech's recognizers, the Windows speech recognizer, and the .NET MAUI Community Toolkit's
// speech to text, injected and through its default instance.
using System.Speech.Recognition;
using CommunityToolkit.Maui.Media;
using Whisper.net;
using V = Vosk;
using WinSpeech = Windows.Media.SpeechRecognition;

namespace Contoso.Dictation;

public sealed class DictationService(ISpeechToText speechToText)
{
    private readonly V.VoskRecognizer _vosk = new(new V.Model("model"), 16000.0f);

    public async Task<string> WhisperAsync(string modelPath, Stream wav)
    {
        using var factory = WhisperFactory.FromPath(modelPath);
        using var processor = factory.CreateBuilder().WithLanguage("auto").Build();
        var text = new System.Text.StringBuilder();
        await foreach (var segment in processor.ProcessAsync(wav))
        {
            text.Append(segment.Text);
        }
        return text.ToString();
    }

    public string Vosk(V.Model model, byte[] pcm)
    {
        var recognizer = new V.VoskRecognizer(model, 16000.0f);
        recognizer.AcceptWaveform(pcm, pcm.Length);
        return recognizer.FinalResult();
    }

    public void Desktop()
    {
        using var engine = new SpeechRecognitionEngine(new System.Globalization.CultureInfo("en-US"));
        engine.SetInputToDefaultAudioDevice();
        using var shared = new SpeechRecognizer();
    }

    public async Task WindowsAsync()
    {
        using var recognizer = new WinSpeech.SpeechRecognizer();
        await recognizer.CompileConstraintsAsync();
    }

    public async Task MauiAsync(CancellationToken token)
    {
        await speechToText.StartListenAsync(new SpeechToTextOptions { Culture = System.Globalization.CultureInfo.CurrentCulture }, token);
        await SpeechToText.Default.StartListenAsync(new SpeechToTextOptions(), token);
    }
}
