// lexcode-expect: 0
// TwiML that greets, forwards and bridges a call without recording it, with the Twilio
// types written in full and no import, and local objects with a record method or a Record
// builder: a metrics timer and a local audit Record.
package demo.calls;

import java.time.Duration;

public class IvrController {
  public String greet() {
    return new com.twilio.twiml.VoiceResponse.Builder()
        .say(new com.twilio.twiml.voice.Say.Builder("Thanks for calling the clerk.").build())
        .gather(new com.twilio.twiml.voice.Gather.Builder().numDigits(1).action("/menu").build())
        .build()
        .toXml();
  }

  public String forward(String to) {
    com.twilio.twiml.voice.Dial dial =
        new com.twilio.twiml.voice.Dial.Builder(to).callerId("+15555550100").timeout(20).build();
    return new com.twilio.twiml.VoiceResponse.Builder().dial(dial).build().toXml();
  }

  public String bridgeUnrecorded(String to) {
    com.twilio.twiml.voice.Dial dial = new com.twilio.twiml.voice.Dial.Builder(to)
        .record(com.twilio.twiml.voice.Dial.Record.DO_NOT_RECORD)
        .build();
    return new com.twilio.twiml.VoiceResponse.Builder().dial(dial).build().toXml();
  }

  public String room() {
    com.twilio.twiml.voice.Conference conference = new com.twilio.twiml.voice.Conference.Builder("support-room")
        .record(com.twilio.twiml.voice.Conference.Record.DO_NOT_RECORD)
        .beep(com.twilio.twiml.voice.Conference.Beep.FALSE)
        .build();
    com.twilio.twiml.voice.Dial dial = new com.twilio.twiml.voice.Dial.Builder().conference(conference).build();
    return new com.twilio.twiml.VoiceResponse.Builder().dial(dial).build().toXml();
  }

  // A metrics timer has a record method too.
  public void timeIt(Meter meter) {
    meter.record(Duration.ofMillis(12));
  }

  // A local audit entry built with a Record.Builder of its own.
  public Record audit(String who) {
    return new Record.Builder().who(who).build();
  }
}

interface Meter {
  void record(Duration duration);
}

class Record {
  private final String who;

  private Record(String who) {
    this.who = who;
  }

  static class Builder {
    private String who;

    Builder who(String who) {
      this.who = who;
      return this;
    }

    Record build() {
      return new Record(who);
    }
  }
}
