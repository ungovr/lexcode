// lexcode-expect: 0
// TwiML that greets, forwards and bridges a call without recording it, a Dial and a Conference that say
// not to record, and look-alikes: the app's own VoiceResponse and Record types in another namespace, and
// an audit log with a Record method.
using Contoso.Telephony;
using Twiml = Twilio.TwiML;
using Voice = Twilio.TwiML.Voice;

namespace Contoso.Front;

public sealed class ForwardController(IAuditLog audit)
{
    public string Forward(string number)
    {
        var response = new Twiml.VoiceResponse();
        response.Say("Connecting you to the front desk.");
        response.Dial(number, callerId: "+15555550100", timeout: 20);
        response.Dial(number, record: Voice.Dial.RecordEnum.DoNotRecord);
        var dial = new Voice.Dial();
        dial.Conference("Front desk", record: Voice.Conference.RecordEnum.DoNotRecord, startConferenceOnEnter: true);
        response.Append(dial);
        audit.Record("call.forwarded", number);
        return response.ToString();
    }

    public string Local()
    {
        var own = new VoiceResponse();
        own.Record(take: 1);
        var entry = new Record("call.forwarded", DateTimeOffset.UtcNow);
        return own.ToString() + entry;
    }
}
