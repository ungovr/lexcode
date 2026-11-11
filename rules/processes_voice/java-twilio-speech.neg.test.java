// lexcode-expect: 0
// Twilio TwiML that reads text to a caller or collects keypad digits: no speech is taken
// in. Say, Pause and a digits-only Gather, with the Twilio types written in full and no
// import. A local voicemail job has a transcribe(true) method of its own and calls it on a
// receiver, the shape of the Twilio Record builder's call.
package demo.voice;

public class Menu {
  public String greeting() {
    return new com.twilio.twiml.VoiceResponse.Builder()
        .say(new com.twilio.twiml.voice.Say.Builder("Thanks for calling.").build())
        .pause(new com.twilio.twiml.voice.Pause.Builder().length(1).build())
        .build()
        .toXml();
  }

  public String keypadList() {
    com.twilio.twiml.voice.Gather gather = new com.twilio.twiml.voice.Gather.Builder()
        .inputs(java.util.Arrays.asList(com.twilio.twiml.voice.Gather.Input.DTMF))
        .numDigits(1)
        .build();
    return new com.twilio.twiml.VoiceResponse.Builder().gather(gather).build().toXml();
  }

  public String keypadMenu() {
    com.twilio.twiml.voice.Gather gather = new com.twilio.twiml.voice.Gather.Builder()
        .inputs(com.twilio.twiml.voice.Gather.Input.DTMF)
        .numDigits(1)
        .action("/menu")
        .say(new com.twilio.twiml.voice.Say.Builder("Press 1 for sales, 2 for support.").build())
        .build();
    return new com.twilio.twiml.VoiceResponse.Builder().gather(gather).build().toXml();
  }
}

// A local voicemail job that shares the transcribe(true) call shape.
class VoicemailJob {
  private final Options options;

  VoicemailJob(Options options) {
    this.options = options;
  }

  void configure() {
    options.transcribe(true);
  }
}

interface Options {
  Options transcribe(boolean on);
}
