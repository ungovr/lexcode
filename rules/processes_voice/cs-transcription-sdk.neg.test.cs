// lexcode-expect: 0
// Speech made from typed text, which is not processing a person's voice (Azure Speech's synthesizer,
// OpenAI text to speech, Amazon Polly, Google Text-to-Speech), speech-service housekeeping that sends
// no audio, a text-to-speech endpoint, and look-alikes: the app's own SpeechRecognizer, SpeechClient
// and AudioClient in another namespace, with methods named like the vendors' (an adapter method too), an
// app media hub whose GetAudioClient returns its own client, and an app plugin builder with registration
// methods named like Semantic Kernel's.
using Amazon.Polly;
using Amazon.Polly.Model;
using Amazon.TranscribeService;
using Contoso.Speech;
using Google.Cloud.TextToSpeech.V1;
using Azs = Microsoft.CognitiveServices.Speech;
using OaiAudio = OpenAI.Audio;

namespace Contoso.Notifications;

public sealed class ReadAloudService(IAmazonPolly polly, IAmazonTranscribeService transcribe)
{
    private const string SpeechEndpoint = "https://api.openai.com/v1/audio/speech";

    public async Task ReadAloudAsync(Azs.SpeechConfig config, string typedText)
    {
        using var synthesizer = new Azs.SpeechSynthesizer(config);
        await synthesizer.SpeakTextAsync(typedText);

        OaiAudio.AudioClient tts = new("tts-1", Environment.GetEnvironmentVariable("OPENAI_API_KEY"));
        await tts.GenerateSpeechAsync(typedText, OaiAudio.GeneratedSpeechVoice.Alloy);

        await polly.SynthesizeSpeechAsync(new SynthesizeSpeechRequest { Text = typedText, VoiceId = VoiceId.Joanna });

        var google = TextToSpeechClient.Create();
        google.SynthesizeSpeech(new SynthesisInput { Text = typedText }, new VoiceSelectionParams { LanguageCode = "en-US" }, new AudioConfig());
    }

    public Task ListVocabulariesAsync() => transcribe.ListVocabulariesAsync(new());

    public async Task<string> LocalAsync(Stream upload)
    {
        var recognizer = new SpeechRecognizer("en-US");
        var client = SpeechClient.Create();
        var audio = new AudioClient();
        await audio.TranscribeAudioAsync(upload);
        var adapted = audio.AsISpeechToTextClient();
        return recognizer.Language + client.Name;
    }

    public async Task HubAsync(MediaHub hub, Stream upload, PluginBuilder plugins)
    {
        await hub.GetAudioClient("archive").TranscribeAudioAsync(upload);
        plugins.AddOpenAIAudioToText("whisper-1");
        plugins.AddAzureOpenAIAudioToText("whisper");
    }
}
