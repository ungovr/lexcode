// lexcode-expect: 6
// Taking a caller's speech through Twilio TwiML: a Gather whose input includes speech (imported and
// aliased), and a voicemail Record verb on the response (imported and aliased), built on its own, and
// target-typed, with and without transcription.
using Twilio.TwiML;
using Twilio.TwiML.Voice;
using Tw = Twilio.TwiML;

namespace Contoso.Phone;

public sealed class VoicemailController
{
    public string Greeting()
    {
        var response = new VoiceResponse();
        response.Gather(input: new List<Gather.InputEnum> { Gather.InputEnum.Speech, Gather.InputEnum.Dtmf }, action: new Uri("/menu", UriKind.Relative));
        var gather = new Tw.Voice.Gather(input: new List<Tw.Voice.Gather.InputEnum> { Tw.Voice.Gather.InputEnum.Speech }, speechTimeout: "auto");
        response.Append(gather);
        response.Record(maxLength: 120, transcribe: true);
        return response.ToString();
    }

    public string AfterHours()
    {
        var response = new Tw.VoiceResponse();
        response.Say("We are closed. Leave a message after the tone.");
        response.Record(maxLength: 60, playBeep: true);
        var verb = new Record(timeout: 5, transcribeCallback: new Uri("/transcribed", UriKind.Relative));
        Record typed = new(maxLength: 30);
        response.Append(verb).Append(typed);
        return response.ToString();
    }
}
