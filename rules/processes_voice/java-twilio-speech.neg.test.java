// lexcode-expect: 0
// Twilio TwiML that reads text to a caller or collects keypad digits: no speech is taken
// in. Say, Pause and a digits-only Gather, and a Record without transcription belong to
// other activities or to none.
package demo.voice;

import com.twilio.twiml.VoiceResponse;
import com.twilio.twiml.voice.Gather;
import com.twilio.twiml.voice.Pause;
import com.twilio.twiml.voice.Say;

public class Menu {
  public String greeting() {
    return new VoiceResponse.Builder()
        .say(new Say.Builder("Thanks for calling.").build())
        .pause(new Pause.Builder().length(1).build())
        .build()
        .toXml();
  }

  public String keypadMenu() {
    Gather gather = new Gather.Builder()
        .input(Gather.Input.DTMF)
        .numDigits(1)
        .action("/menu")
        .say(new Say.Builder("Press 1 for sales, 2 for support.").build())
        .build();
    return new VoiceResponse.Builder().gather(gather).build().toXml();
  }
}
