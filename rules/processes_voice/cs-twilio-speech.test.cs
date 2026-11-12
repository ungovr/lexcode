// lexcode-expect: 5
// Taking a caller's speech through Twilio TwiML: a Gather whose input includes speech (imported and
// aliased), a Record verb that transcribes the message, one with only a transcription callback, and a
// Record built on its own, target-typed.
using Twilio.TwiML;
using Twilio.TwiML.Voice;
using Tw = Twilio.TwiML.Voice;

namespace Contoso.Phone;

public sealed class VoicemailController
{
    public string Greeting()
    {
        var response = new VoiceResponse();
        response.Gather(input: new List<Gather.InputEnum> { Gather.InputEnum.Speech, Gather.InputEnum.Dtmf }, action: new Uri("/menu", UriKind.Relative));
        var gather = new Tw.Gather(input: new List<Tw.Gather.InputEnum> { Tw.Gather.InputEnum.Speech }, speechTimeout: "auto");
        response.Append(gather);
        response.Record(maxLength: 120, transcribe: true);
        response.Record(transcribeCallback: new Uri("/transcribed", UriKind.Relative));
        return response.ToString();
    }

    public Record Message()
    {
        Record verb = new(maxLength: 60, transcribe: true);
        return verb;
    }
}
