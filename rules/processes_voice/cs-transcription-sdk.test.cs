// lexcode-expect: 18
// Sending recorded speech to speech-to-text services from C#: Azure AI Speech recognizers (imported,
// aliased, and a target-typed field), Amazon Transcribe jobs on an injected client and on one the
// method builds, Google Cloud Speech (V1 imported and injected, V2 aliased), OpenAI's AudioClient
// built directly and taken from an OpenAIClient, Microsoft.Extensions.AI and Semantic Kernel speech to
// text, AssemblyAI, Deepgram, and a transcription endpoint in a string.
using AssemblyAI;
using Amazon.TranscribeService;
using Amazon.TranscribeService.Model;
using Deepgram;
using Google.Cloud.Speech.V1;
using Microsoft.CognitiveServices.Speech;
using Microsoft.CognitiveServices.Speech.Audio;
using Microsoft.CognitiveServices.Speech.Transcription;
using Microsoft.Extensions.AI;
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.AudioToText;
using OpenAI;
using OpenAI.Audio;
using Sk = Microsoft.SemanticKernel.AudioToText;
using Speech2 = Google.Cloud.Speech.V2;
using Translation = Microsoft.CognitiveServices.Speech.Translation;

namespace Contoso.Voicemail;

public sealed class VoicemailTranscriber(
    IAmazonTranscribeService transcribe,
    SpeechClient speech,
    ISpeechToTextClient speechToText,
    Sk.IAudioToTextService audioToText)
{
    private const string DeepgramListen = "https://api.deepgram.com/v1/listen?model=nova-2&diarize=true";

    private readonly SpeechRecognizer _live = new(SpeechConfig.FromSubscription("key", "westus"));

    public async Task<string> AzureAsync(SpeechConfig config, Translation.SpeechTranslationConfig translationConfig, string wav)
    {
        using var audio = AudioConfig.FromWavFileInput(wav);
        using var recognizer = new SpeechRecognizer(config, audio);
        var result = await recognizer.RecognizeOnceAsync();
        using var meeting = new ConversationTranscriber(config, audio);
        using var translator = new Translation.TranslationRecognizer(translationConfig, audio);
        return result.Text;
    }

    public Task StartJobAsync(string mediaUri) =>
        transcribe.StartTranscriptionJobAsync(new StartTranscriptionJobRequest
        {
            TranscriptionJobName = Guid.NewGuid().ToString(),
            Media = new Media { MediaFileUri = mediaUri },
            LanguageCode = "en-US",
        });

    public async Task StartAnalyticsAsync()
    {
        using var client = new AmazonTranscribeServiceClient();
        await client.StartCallAnalyticsJobAsync(new() { CallAnalyticsJobName = "support-call" });
    }

    public async Task<string> GoogleAsync(string path, RecognitionConfig config)
    {
        var client = SpeechClient.Create();
        var response = client.Recognize(config, RecognitionAudio.FromFile(path));
        await speech.LongRunningRecognizeAsync(config, RecognitionAudio.FromStorageUri("gs://bucket/call.flac"));
        var v2 = await Speech2.SpeechClient.CreateAsync();
        await v2.RecognizeAsync(new Speech2.RecognizeRequest());
        return response.Results.First().Alternatives.First().Transcript;
    }

    public async Task<string> WhisperAsync(string path)
    {
        AudioClient whisper = new("whisper-1", Environment.GetEnvironmentVariable("OPENAI_API_KEY"));
        AudioTranscription transcription = await whisper.TranscribeAudioAsync(path);
        return transcription.Text;
    }

    public async Task<string> TranslateAsync(OpenAIClient openAi, Stream memo)
    {
        AudioClient audioClient = openAi.GetAudioClient("whisper-1");
        var translation = await audioClient.TranslateAudioAsync(memo, "memo.m4a");
        var direct = await openAi.GetAudioClient("whisper-1").TranscribeAudioAsync(memo, "memo.m4a");
        return translation.Value.Text + direct.Value.Text;
    }

    public async Task<string> ExtensionsAiAsync(Stream memo)
    {
        var response = await speechToText.GetTextAsync(memo);
        return response.Text;
    }

    public async Task<string?> KernelAsync(Kernel kernel, Microsoft.SemanticKernel.AudioContent clip)
    {
        var fromKernel = kernel.GetRequiredService<IAudioToTextService>();
        var text = await audioToText.GetTextContentAsync(clip);
        return text.Text;
    }

    public async Task<string?> AssemblyAsync(AssemblyAIClient assembly)
    {
        var transcript = await assembly.Transcripts.TranscribeAsync(new FileInfo("call.mp3"));
        return transcript.Text;
    }

    public void Listen()
    {
        var listen = ClientFactory.CreateListenRESTClient();
    }
}
