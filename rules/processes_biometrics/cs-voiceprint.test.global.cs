// lexcode-expect: 2
// Amazon Connect Voice ID with its namespace imported by a `global using` in another file, so this file has
// no using lines and only the vendor-named short forms find it: injected, and a client the method builds.
namespace Contoso.Callers;

public sealed class GlobalVerification(IAmazonVoiceID voiceId)
{
    public async Task EnrollAsync(string domainId)
    {
        await voiceId.StartSpeakerEnrollmentJobAsync(new() { DomainId = domainId });
        var client = new AmazonVoiceIDClient();
        await client.EvaluateSessionAsync(new() { DomainId = domainId, SessionNameOrId = "call-3" });
    }
}
