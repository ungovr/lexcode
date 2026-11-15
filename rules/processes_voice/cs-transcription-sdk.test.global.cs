// lexcode-expect: 3
// Speech-to-text clients with their namespaces imported by a `global using` in another file, so this file
// has no using lines and only the vendor-named short forms find them: Amazon Transcribe injected and built
// by the method, and AssemblyAI.
namespace Contoso.Voicemail;

public sealed class GlobalTranscriber(IAmazonTranscribeService transcribe, AssemblyAIClient assembly)
{
    public async Task RunAsync(string mediaUri)
    {
        await transcribe.StartTranscriptionJobAsync(new() { TranscriptionJobName = "vm-1" });
        var client = new AmazonTranscribeServiceClient();
        await client.StartCallAnalyticsJobAsync(new() { CallAnalyticsJobName = "call-1" });
        await assembly.Transcripts.TranscribeAsync(new Uri(mediaUri));
    }
}
