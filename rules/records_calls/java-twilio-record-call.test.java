// lexcode-expect: 5
// Placing a Twilio call with recording on, starting a recording on a live call, and
// opening a video room that records its participants, with the Twilio Java helper library.
package demo.calls;

import com.twilio.Twilio;
import com.twilio.rest.api.v2010.account.*;
import com.twilio.rest.api.v2010.account.call.Recording;
import com.twilio.rest.video.v1.Room;
import com.twilio.type.PhoneNumber;
import java.net.URI;

public class CallCenter {
  public CallCenter(String sid, String token) {
    Twilio.init(sid, token);
  }

  public Call callAndRecord(String to, String from, String url) {
    return Call.creator(new PhoneNumber(to), new PhoneNumber(from), URI.create(url))
        .setRecord(true)
        .setRecordingChannels("dual")
        .create();
  }

  public Call callWithSetting(String to, String from, String url, boolean record) {
    return Call.creator(new PhoneNumber(to), new PhoneNumber(from), URI.create(url))
        .setRecord(record)
        .create();
  }

  public Recording recordMidCall(String callSid) {
    return Recording.creator(callSid).create();
  }

  public Room openRecordedRoom(String name) {
    return Room.creator().setUniqueName(name).setRecordParticipantsOnConnect(true).create();
  }

  public Call callWithRecordingOptions(String to, String from, String url) {
    Call.Creator creator = Call.creator(new PhoneNumber(to), new PhoneNumber(from), URI.create(url));
    creator.setRecord(true);
    return creator.create();
  }
}
