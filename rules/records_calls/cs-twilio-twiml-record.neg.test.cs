// lexcode-expect: 0
// TwiML that greets, forwards and bridges a call without recording it, a Dial and a Conference that say not
// to record or pass null, and a voicemail Record verb, which records one caller's own message
// (processes_voice, not people talking to each other). Look-alikes: the app's own VoiceResponse and Dial
// in another namespace with record options of their own, and an audit log with a Record method.
using Twiml = Twilio.TwiML;
using Voice = Twilio.TwiML.Voice;

namespace Contoso.Front;

public sealed class ForwardController(Contoso.Telephony.IAuditLog audit)
{
    public string Forward(string number)
    {
        var response = new Twiml.VoiceResponse();
        response.Say("Connecting you to the front desk.");
        response.Dial(number, callerId: "+15555550100", timeout: 20);
        response.Dial(number, record: Voice.Dial.RecordEnum.DoNotRecord);
        response.Dial(number, record: null);
        response.Dial(number, record: (null));
        var dial = new Voice.Dial();
        dial.Conference("Front desk", record: Voice.Conference.RecordEnum.DoNotRecord, startConferenceOnEnter: true);
        Voice.Conference quiet = new("Back office", record: null);
        response.Append(dial);
        audit.Record("call.forwarded", number);
        return response.ToString();
    }

    public string Voicemail()
    {
        var response = new Twiml.VoiceResponse();
        response.Say("Leave a message after the tone.");
        response.Record(maxLength: 120, playBeep: true);
        return response.ToString();
    }

    public string Local(string number)
    {
        var own = new Contoso.Telephony.VoiceResponse();
        own.Dial(number, record: Contoso.Telephony.RecordMode.Always);
        var ownDial = new Contoso.Telephony.Dial(number, record: true);
        return own.ToString() + ownDial;
    }
}
