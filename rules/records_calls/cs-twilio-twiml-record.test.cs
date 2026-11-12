// lexcode-expect: 6
// Answering a Twilio call with TwiML that records it: a Record verb on the response (imported and
// aliased), a Record built on its own and target-typed, a Dial that records the bridged call, and a
// conference that records from the start.
using Twilio.TwiML;
using Twilio.TwiML.Voice;
using Tw = Twilio.TwiML;

namespace Contoso.SupportLine;

public sealed class SupportLineController
{
    public string Voicemail()
    {
        var response = new VoiceResponse();
        response.Say("Leave a message after the tone.");
        response.Record(maxLength: 120, playBeep: true);
        Record verb = new(timeout: 5);
        response.Append(verb);
        return response.ToString();
    }

    public string Bridge(string agent)
    {
        var response = new Tw.VoiceResponse();
        response.Dial(agent, record: Dial.RecordEnum.RecordFromAnswerDual);
        response.Record(timeout: 5);
        return response.ToString();
    }

    public string Conference(string room)
    {
        var dial = new Dial();
        dial.Conference(room, record: Twilio.TwiML.Voice.Conference.RecordEnum.RecordFromStart);
        var standalone = new Twilio.TwiML.Voice.Conference(room, record: Twilio.TwiML.Voice.Conference.RecordEnum.RecordFromStart);
        return dial.ToString() + standalone;
    }
}
