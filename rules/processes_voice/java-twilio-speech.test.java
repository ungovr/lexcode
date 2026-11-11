// lexcode-expect: 3
// Taking a caller's speech through Twilio TwiML: a Gather that listens for speech (alone
// and alongside keypad digits) and a voicemail Record that asks Twilio to transcribe.
package demo.voice;

import com.twilio.twiml.VoiceResponse;
import com.twilio.twiml.voice.Gather;
import com.twilio.twiml.voice.Record;
import com.twilio.twiml.voice.Say;

public class Assistant {
  public String listen() {
    Gather gather = new Gather.Builder()
        .input(Gather.Input.SPEECH)
        .action("/handle-speech")
        .say(new Say.Builder("How can I help you?").build())
        .build();
    return new VoiceResponse.Builder().gather(gather).build().toXml();
  }

  public String listenOrKeys() {
    Gather gather = new Gather.Builder()
        .input(Gather.Input.DTMF, Gather.Input.SPEECH)
        .action("/handle")
        .build();
    return new VoiceResponse.Builder().gather(gather).build().toXml();
  }

  public String voicemail() {
    Record record = new Record.Builder().transcribe(true).transcribeCallback("/transcribed").maxLength(60).build();
    return new VoiceResponse.Builder().record(record).build().toXml();
  }
}
