// lexcode-expect: 4
// The rest of the on-device recognizers: a Whisper.net model loaded from memory, and System.Speech's two
// recognizers and the Windows speech recognizer, each target-typed (the Windows one aliased).
using System.Speech.Recognition;
using Whisper.net;
using WinSpeech = Windows.Media.SpeechRecognition;

namespace Contoso.Dictation;

public sealed class KioskDictation
{
    private readonly SpeechRecognitionEngine _engine = new(new System.Globalization.CultureInfo("en-GB"));

    public void Load(byte[] model)
    {
        using var factory = WhisperFactory.FromBuffer(model);
        using SpeechRecognizer shared = new();
        WinSpeech.SpeechRecognizer windows = new();
    }
}
