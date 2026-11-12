// lexcode-expect: 5
// Speech-to-text clients reached through namespace aliases, which only the fully qualified forms resolve:
// Amazon Transcribe injected through its interface and built by the method, AssemblyAI, an OpenAI audio
// client, and a Microsoft.Extensions.AI speech-to-text client.
using Aai = AssemblyAI;
using Mai = Microsoft.Extensions.AI;
using Oai = OpenAI.Audio;
using Tx = Amazon.TranscribeService;

namespace Contoso.Voicemail;

public sealed class AliasedTranscriber(Tx.IAmazonTranscribeService transcribe, Aai.AssemblyAIClient assembly, Mai.ISpeechToTextClient speechToText)
{
    public async Task RunAsync(string path, Stream memo)
    {
        await transcribe.StartMedicalTranscriptionJobAsync(new() { MedicalTranscriptionJobName = "visit-1" });
        Tx.AmazonTranscribeServiceClient client = new();
        await client.StartMedicalScribeJobAsync(new() { MedicalScribeJobName = "visit-1" });
        await assembly.Transcripts.SubmitAsync(new FileInfo(path));
        Oai.AudioClient whisper = new("whisper-1", Environment.GetEnvironmentVariable("OPENAI_API_KEY"));
        await whisper.TranscribeAudioAsync(path);
        await foreach (var update in speechToText.GetStreamingTextAsync(memo))
        {
        }
    }
}
