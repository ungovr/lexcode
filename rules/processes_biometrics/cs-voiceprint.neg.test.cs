// lexcode-expect: 0
// A caller's speech turned into text and Voice ID configuration that enrolls no one, which is not a
// voiceprint, and look-alikes: the app's own SpeakerRecognizer and VoiceProfileClient in another
// namespace, and an app service with methods named like Voice ID's.
using Amazon.VoiceID;
using Amazon.VoiceID.Model;
using Contoso.Callers;
using Azs = Microsoft.CognitiveServices.Speech;

namespace Contoso.Calls;

public sealed class CallerNotes(IAmazonVoiceID voiceId, CallerScoring scoring)
{
    public async Task<string> TranscribeAsync(Azs.SpeechConfig config)
    {
        using var recognizer = new Azs.SpeechRecognizer(config);
        var result = await recognizer.RecognizeOnceAsync();
        await voiceId.ListDomainsAsync(new ListDomainsRequest());
        await voiceId.DescribeDomainAsync(new DescribeDomainRequest { DomainId = "domain" });
        return result.Text;
    }

    public async Task LocalAsync(string callerId)
    {
        var recognizer = new SpeakerRecognizer(callerId);
        var profiles = new VoiceProfileClient();
        await scoring.EvaluateSessionAsync(callerId);
        await scoring.StartSpeakerEnrollmentJobAsync(callerId);
    }
}
