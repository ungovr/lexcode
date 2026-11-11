// lexcode-expect: 0
// Twilio calls placed or handled without recording: a plain call, record turned off, a
// hang-up, a text message and a video room without recording, with the Twilio types
// written in full and no import. A local call log has Recording.creator, setRecord and
// setRecordParticipantsOnConnect calls of its own, which are not Twilio's.
package demo.calls;

public class OutboundCalls {
  public OutboundCalls(String sid, String token) {
    com.twilio.Twilio.init(sid, token);
  }

  public Object place(String to, String from, String url) {
    return com.twilio.rest.api.v2010.account.Call.creator(
            new com.twilio.type.PhoneNumber(to), new com.twilio.type.PhoneNumber(from), java.net.URI.create(url))
        .setStatusCallback(java.net.URI.create("https://example.org/status"))
        .create();
  }

  public Object placeUnrecorded(String to, String from, String url) {
    return com.twilio.rest.api.v2010.account.Call.creator(
            new com.twilio.type.PhoneNumber(to), new com.twilio.type.PhoneNumber(from), java.net.URI.create(url))
        .setRecord(false)
        .create();
  }

  public void hangUp(String callSid) {
    com.twilio.rest.api.v2010.account.Call.updater(callSid)
        .setStatus(com.twilio.rest.api.v2010.account.Call.UpdateStatus.COMPLETED)
        .update();
  }

  public Object remind(String to, String from, String body) {
    return com.twilio.rest.api.v2010.account.Message.creator(
            new com.twilio.type.PhoneNumber(to), new com.twilio.type.PhoneNumber(from), body)
        .create();
  }

  public Object openRoom(String name) {
    return com.twilio.rest.video.v1.Room.creator().setUniqueName(name).setRecordParticipantsOnConnect(false).create();
  }
}

// A local call log with the same call shapes, not Twilio.
class CallLog {
  private final LogEntry entry;

  CallLog(LogEntry entry) {
    this.entry = entry;
  }

  void note(String callId) {
    entry.setRecord(true);
    entry.setRecordParticipantsOnConnect(true);
    Recording.creator(callId);
  }
}

interface LogEntry {
  LogEntry setRecord(boolean value);

  LogEntry setRecordParticipantsOnConnect(boolean value);
}

class Recording {
  static Recording creator(String callId) {
    return new Recording();
  }
}
