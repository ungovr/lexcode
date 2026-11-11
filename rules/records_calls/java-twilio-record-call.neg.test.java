// lexcode-expect: 0
// Twilio calls placed or handled without recording: a plain call, record turned off, a
// hang-up, a text message, a video room without recording, and a local Recording class
// that is not Twilio's.
package demo.calls;

import com.twilio.Twilio;
import com.twilio.rest.api.v2010.account.Call;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.rest.video.v1.Room;
import com.twilio.type.PhoneNumber;
import java.net.URI;

public class OutboundCalls {
  public OutboundCalls(String sid, String token) {
    Twilio.init(sid, token);
  }

  public Call place(String to, String from, String url) {
    return Call.creator(new PhoneNumber(to), new PhoneNumber(from), URI.create(url))
        .setStatusCallback(URI.create("https://example.org/status"))
        .create();
  }

  public Call placeUnrecorded(String to, String from, String url) {
    return Call.creator(new PhoneNumber(to), new PhoneNumber(from), URI.create(url))
        .setRecord(false)
        .create();
  }

  public void hangUp(String callSid) {
    Call.updater(callSid).setStatus(Call.UpdateStatus.COMPLETED).update();
  }

  public Message remind(String to, String from, String body) {
    return Message.creator(new PhoneNumber(to), new PhoneNumber(from), body).create();
  }

  public Room openRoom(String name) {
    return Room.creator().setUniqueName(name).setRecordParticipantsOnConnect(false).create();
  }
}

// A local audit entry, not a Twilio recording.
class Recording {
  static Recording creator(String callId) {
    return new Recording();
  }

  Recording setRecord(boolean value) {
    return this;
  }
}
