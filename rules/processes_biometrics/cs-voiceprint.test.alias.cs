// lexcode-expect: 3
// Amazon Connect Voice ID reached through a namespace alias, which only the fully qualified forms resolve:
// the client injected through its interface, and one the method builds.
using Vid = Amazon.VoiceID;

namespace Contoso.Callers;

public sealed class AliasedVerification(Vid.IAmazonVoiceID voiceId)
{
    public async Task EnrollAsync(string domainId)
    {
        await voiceId.StartFraudsterRegistrationJobAsync(new() { DomainId = domainId });
        Vid.AmazonVoiceIDClient client = new();
        await client.StartSpeakerEnrollmentJobAsync(new() { DomainId = domainId });
        await client.EvaluateSessionAsync(new() { DomainId = domainId, SessionNameOrId = "call-2" });
    }
}
