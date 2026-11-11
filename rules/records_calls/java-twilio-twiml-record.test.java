// lexcode-expect: 4
// Answering a Twilio call with TwiML that records it: a Record verb, a Dial that records
// the bridged call, and a Conference that records the room.
package demo.calls;

import com.twilio.twiml.VoiceResponse;
import com.twilio.twiml.voice.Conference;
import com.twilio.twiml.voice.Dial;
import com.twilio.twiml.voice.Record;

public class RecordedLines {
  public String leaveMessage() {
    Record record = new Record.Builder().maxLength(120).playBeep(true).build();
    return new VoiceResponse.Builder().record(record).build().toXml();
  }

  public String bridgeRecorded(String to) {
    Dial dial = new Dial.Builder(to).record(Dial.Record.RECORD_FROM_ANSWER_DUAL).build();
    return new VoiceResponse.Builder().dial(dial).build().toXml();
  }

  public String recordedRoom() {
    Conference conference = new Conference.Builder("support-room")
        .record(Conference.Record.RECORD_FROM_START)
        .build();
    Dial dial = new Dial.Builder().conference(conference).build();
    return new VoiceResponse.Builder().dial(dial).build().toXml();
  }

  public String bridgeWithSetting(String to, Dial.Record setting) {
    Dial dial = new Dial.Builder(to).record(setting).build();
    return new VoiceResponse.Builder().dial(dial).build().toXml();
  }
}
