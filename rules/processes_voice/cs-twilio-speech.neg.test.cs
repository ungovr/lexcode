// lexcode-expect: 0
// TwiML that takes keypad digits, reads typed text aloud and plays audio, with no speech recognition
// or transcription, a Record verb that says not to transcribe, and look-alikes: the app's own
// VoiceResponse and Gather in another namespace, with speech and transcribe options of their own.
using Contoso.Ivr;
using Twiml = Twilio.TwiML;
using Voice = Twilio.TwiML.Voice;

namespace Contoso.Phone;

public sealed class MenuController
{
    public string Menu()
    {
        var response = new Twiml.VoiceResponse();
        response.Say("Press 1 for opening hours.");
        response.Gather(input: new List<Voice.Gather.InputEnum> { Voice.Gather.InputEnum.Dtmf }, numDigits: 1);
        response.Play(new Uri("https://example.com/hold.mp3"));
        response.Record(maxLength: 60, transcribe: false);
        return response.ToString();
    }

    public string Local()
    {
        var own = new VoiceResponse();
        own.Record(transcribe: true);
        own.Gather(input: Gather.InputEnum.Speech);
        return own.ToString();
    }
}
