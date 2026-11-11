// lexcode-expect: 0
// Video and meeting platform code that carries or reads a call without recording it: a
// LiveKit token and room listing, a Chime meeting without a capture pipeline, a Zoom
// meetings lookup that never touches recordings, a Daily room with recording off, and a
// Vonage connect action, with the vendor types written in full and no import. A local
// archive has startRoomCompositeEgress, startParticipantEgress, startTrackCompositeEgress,
// startTrackEgress, createMediaCapturePipeline and startContactRecording methods of its
// own and calls them on a receiver, and a RecordAction.Builder of its own.
package demo.meetings;

public class MeetingDesk {
  private final io.livekit.server.RoomServiceClient rooms;
  private final software.amazon.awssdk.services.chimesdkmeetings.ChimeSdkMeetingsClient chime =
      software.amazon.awssdk.services.chimesdkmeetings.ChimeSdkMeetingsClient.create();

  public MeetingDesk(io.livekit.server.RoomServiceClient rooms) {
    this.rooms = rooms;
  }

  public String joinToken(String key, String secret, String identity) {
    io.livekit.server.AccessToken token = new io.livekit.server.AccessToken(key, secret);
    token.setIdentity(identity);
    return token.toJwt();
  }

  public Object listRooms() throws Exception {
    return rooms.listRooms().execute();
  }

  public Object startMeeting(String token) {
    return chime.createMeeting(
        software.amazon.awssdk.services.chimesdkmeetings.model.CreateMeetingRequest.builder().clientRequestToken(token).build());
  }

  public String zoomMeetingList() {
    return "https://api.zoom.us/v2/users/me/meetings";
  }

  public String dailyRoomWithoutRecording() {
    return "{\"properties\":{\"enable_chat\":true,\"enable_recording\":\"off\"}}";
  }

  public Object bridge(String number) {
    return new com.vonage.client.voice.ncco.ConnectAction.Builder().build();
  }
}

// A local meeting archive that shares method names with the recording APIs.
class MeetingArchive {
  private final Archive archive;

  MeetingArchive(Archive archive) {
    this.archive = archive;
  }

  void tidy(String id) {
    archive.startRoomCompositeEgress(id);
    archive.startParticipantEgress(id);
    archive.startTrackCompositeEgress(id);
    archive.startTrackEgress(id);
    archive.createMediaCapturePipeline(id);
    archive.startContactRecording(id);
  }

  Object prompt() {
    return new RecordAction.Builder().build();
  }
}

interface Archive {
  void startRoomCompositeEgress(String id);

  void startParticipantEgress(String id);

  void startTrackCompositeEgress(String id);

  void startTrackEgress(String id);

  void createMediaCapturePipeline(String id);

  void startContactRecording(String id);
}

class RecordAction {
  static class Builder {
    Object build() {
      return new Object();
    }
  }
}
