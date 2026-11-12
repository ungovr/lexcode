// lexcode-expect: 0
// TwiML that takes keypad digits, reads typed text aloud, plays audio and bridges a recorded call between
// two people (records_calls, not one voice), with no speech recognition or voice message, and look-alikes:
// the app's own VoiceResponse, Gather and Record in another namespace, with speech, record and transcribe
// options of their own.
using Twiml = Twilio.TwiML;
using Voice = Twilio.TwiML.Voice;

namespace Contoso.Phone;

public sealed class MenuController
{
    public string Menu(string agent)
    {
        var response = new Twiml.VoiceResponse();
        response.Say("Press 1 for opening hours.");
        response.Gather(input: new List<Voice.Gather.InputEnum> { Voice.Gather.InputEnum.Dtmf }, numDigits: 1);
        response.Play(new Uri("https://example.com/hold.mp3"));
        response.Dial(agent, record: Voice.Dial.RecordEnum.RecordFromAnswerDual);
        return response.ToString();
    }

    public string Local()
    {
        var own = new Contoso.Ivr.VoiceResponse();
        own.Record(transcribe: true);
        own.Gather(input: Contoso.Ivr.Gather.InputEnum.Speech);
        var entry = new Contoso.Ivr.Record("menu.played");
        return own.ToString() + entry;
    }
}
