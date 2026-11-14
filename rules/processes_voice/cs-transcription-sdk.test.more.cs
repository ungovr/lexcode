// lexcode-expect: 21
// The rest of each speech-to-text client: Azure AI Speech's intent recognizer and meeting transcriber built
// and target-typed, and its translation recognizer and conversation transcriber target-typed; every Google
// Cloud Speech version's Create, CreateAsync, builder and target-typed builder, and recognition on an
// injected V1P1Beta1 and V2 client (each version aliased, since all three name their client SpeechClient);
// Deepgram's live-streaming client; transcription chained on an Azure OpenAI client; and an OpenAI audio
// client turned into a Microsoft.Extensions.AI speech-to-text client.
using Azure.AI.OpenAI;
using Deepgram;
using Microsoft.CognitiveServices.Speech;
using Microsoft.CognitiveServices.Speech.Audio;
using Microsoft.CognitiveServices.Speech.Intent;
using Microsoft.CognitiveServices.Speech.Transcription;
using Microsoft.CognitiveServices.Speech.Translation;
using OpenAI.Audio;
using G1 = Google.Cloud.Speech.V1;
using Gb = Google.Cloud.Speech.V1P1Beta1;
using G2 = Google.Cloud.Speech.V2;

namespace Contoso.Voicemail;

public sealed class SpeechVendors(Gb.SpeechClient beta, G2.SpeechClient v2, AzureOpenAIClient azureOpenAi, AudioClient whisper)
{
    public void Azure(SpeechConfig config, SpeechTranslationConfig translationConfig, AudioConfig audio)
    {
        using var intents = new IntentRecognizer(config, audio);
        using IntentRecognizer typedIntents = new(config);
        using TranslationRecognizer translator = new(translationConfig, audio);
        using ConversationTranscriber conversation = new(config, audio);
        using var meeting = new MeetingTranscriber(audio);
        using MeetingTranscriber typedMeeting = new(audio);
    }

    public async Task GoogleAsync(Gb.RecognitionConfig config, Gb.RecognitionAudio audio)
    {
        var v1 = await G1.SpeechClient.CreateAsync();
        var v1Built = new G1.SpeechClientBuilder { Endpoint = "eu-speech.googleapis.com" }.Build();
        G1.SpeechClientBuilder v1Typed = new() { Endpoint = "eu-speech.googleapis.com" };

        var b1 = Gb.SpeechClient.Create();
        var b2 = await Gb.SpeechClient.CreateAsync();
        var b3 = new Gb.SpeechClientBuilder().Build();
        Gb.SpeechClientBuilder b4 = new();
        await beta.RecognizeAsync(config, audio);

        var c1 = G2.SpeechClient.Create();
        var c2 = new G2.SpeechClientBuilder().Build();
        G2.SpeechClientBuilder c3 = new();
        await v2.BatchRecognizeAsync(new G2.BatchRecognizeRequest());
    }

    public async Task OtherAsync(Stream memo)
    {
        var live = ClientFactory.CreateListenWebSocketClient();
        var translated = await azureOpenAi.GetAudioClient("whisper").TranslateAudioAsync(memo, "memo.m4a");
        var speechToText = whisper.AsISpeechToTextClient();
    }
}
