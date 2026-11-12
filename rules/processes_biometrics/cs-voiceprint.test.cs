// lexcode-expect: 6
// Enrolling and matching speakers by voiceprint: Amazon Connect Voice ID (injected through its interface,
// and a client the method builds), and Azure AI Speech speaker recognition (imported, aliased, and a
// target-typed field).
using Amazon.VoiceID;
using Amazon.VoiceID.Model;
using Microsoft.CognitiveServices.Speech;
using Microsoft.CognitiveServices.Speech.Audio;
using Microsoft.CognitiveServices.Speech.Speaker;
using Spk = Microsoft.CognitiveServices.Speech.Speaker;

namespace Contoso.Callers;

public sealed class CallerVerification(IAmazonVoiceID voiceId)
{
    private readonly VoiceProfileClient _profiles = new(SpeechConfig.FromSubscription("key", "westus"));

    public async Task EnrollAsync(string domainId, string roleArn)
    {
        await voiceId.StartSpeakerEnrollmentJobAsync(new StartSpeakerEnrollmentJobRequest { DomainId = domainId, DataAccessRoleArn = roleArn });
        using var client = new AmazonVoiceIDClient();
        var score = await client.EvaluateSessionAsync(new() { DomainId = domainId, SessionNameOrId = "call-1" });
    }

    public async Task<bool> VerifyAsync(SpeechConfig config, VoiceProfile profile, AudioConfig audio)
    {
        using var recognizer = new SpeakerRecognizer(config, audio);
        var model = SpeakerVerificationModel.FromProfile(profile);
        var result = await recognizer.RecognizeOnceAsync(model);
        var who = Spk.SpeakerIdentificationModel.FromProfiles(new[] { profile });
        return result.ProfileId == profile.Id;
    }
}
