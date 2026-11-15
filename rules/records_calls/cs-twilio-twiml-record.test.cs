// lexcode-expect: 7
// Answering a Twilio call with TwiML that records the people on it: a Dial that records the bridged call
// on the response (imported and aliased), built on its own and target-typed, and a conference that records
// from the start, on a Dial, built on its own and target-typed.
using Twilio.TwiML;
using Twilio.TwiML.Voice;
using Tw = Twilio.TwiML;

namespace Contoso.SupportLine;

public sealed class SupportLineController
{
    public string Bridge(string agent)
    {
        var response = new VoiceResponse();
        response.Dial(agent, record: Dial.RecordEnum.RecordFromAnswerDual);
        var aliased = new Tw.VoiceResponse();
        aliased.Dial(agent, timeout: 20, record: Tw.Voice.Dial.RecordEnum.RecordFromRinging);
        var standalone = new Dial(record: Dial.RecordEnum.RecordFromAnswer);
        Dial typed = new(agent, record: Dial.RecordEnum.RecordFromRingingDual);
        return response.ToString() + aliased + standalone + typed;
    }

    public string Conference(string room)
    {
        var dial = new Dial();
        dial.Conference(room, record: Twilio.TwiML.Voice.Conference.RecordEnum.RecordFromStart);
        var standalone = new Twilio.TwiML.Voice.Conference(room, record: Twilio.TwiML.Voice.Conference.RecordEnum.RecordFromStart);
        Twilio.TwiML.Voice.Conference typed = new(room, startConferenceOnEnter: true, record: Twilio.TwiML.Voice.Conference.RecordEnum.RecordFromStart);
        return dial.ToString() + standalone + typed;
    }
}
