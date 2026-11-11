// lexcode-expect: 0
// TwiML that greets, forwards and bridges a call without recording it, and local objects
// with a record method: a metrics timer and a flight recorder.
package demo.calls;

import com.twilio.twiml.VoiceResponse;
import com.twilio.twiml.voice.Conference;
import com.twilio.twiml.voice.Dial;
import com.twilio.twiml.voice.Gather;
import com.twilio.twiml.voice.Say;
import java.time.Duration;

public class IvrController {
  public String greet() {
    return new VoiceResponse.Builder()
        .say(new Say.Builder("Thanks for calling the clerk.").build())
        .gather(new Gather.Builder().numDigits(1).action("/menu").build())
        .build()
        .toXml();
  }

  public String forward(String to) {
    Dial dial = new Dial.Builder(to).callerId("+15555550100").timeout(20).build();
    return new VoiceResponse.Builder().dial(dial).build().toXml();
  }

  public String bridgeUnrecorded(String to) {
    Dial dial = new Dial.Builder(to).record(Dial.Record.DO_NOT_RECORD).build();
    return new VoiceResponse.Builder().dial(dial).build().toXml();
  }

  public String room() {
    Conference conference = new Conference.Builder("support-room")
        .record(Conference.Record.DO_NOT_RECORD)
        .beep(Conference.Beep.FALSE)
        .build();
    Dial dial = new Dial.Builder().conference(conference).build();
    return new VoiceResponse.Builder().dial(dial).build().toXml();
  }

  // A metrics timer has a record method too.
  public void timeIt(Meter meter) {
    meter.record(Duration.ofMillis(12));
  }
}

interface Meter {
  void record(Duration duration);
}
