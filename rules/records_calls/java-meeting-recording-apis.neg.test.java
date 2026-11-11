// lexcode-expect: 0
// Video and meeting platform code that carries or reads a call without recording it: a
// LiveKit token and room listing, a Chime meeting without a capture pipeline, a Zoom
// meetings lookup that never touches recordings, a Daily room with recording off, a
// Vonage connect action, and local methods named after recording calls.
package demo.meetings;

import io.livekit.server.AccessToken;
import io.livekit.server.RoomServiceClient;
import software.amazon.awssdk.services.chimesdkmeetings.ChimeSdkMeetingsClient;
import software.amazon.awssdk.services.chimesdkmeetings.model.CreateMeetingRequest;
import com.vonage.client.voice.ncco.ConnectAction;

public class MeetingDesk {
  private final RoomServiceClient rooms;
  private final ChimeSdkMeetingsClient chime = ChimeSdkMeetingsClient.create();

  public MeetingDesk(RoomServiceClient rooms) {
    this.rooms = rooms;
  }

  public String joinToken(String key, String secret, String identity) {
    AccessToken token = new AccessToken(key, secret);
    token.setIdentity(identity);
    return token.toJwt();
  }

  public Object listRooms() throws Exception {
    return rooms.listRooms().execute();
  }

  public Object startMeeting(String token) {
    return chime.createMeeting(CreateMeetingRequest.builder().clientRequestToken(token).build());
  }

  public String zoomMeetingList() {
    return "https://api.zoom.us/v2/users/me/meetings";
  }

  public String dailyRoomWithoutRecording() {
    return "{\"properties\":{\"enable_chat\":true,\"enable_recording\":\"off\"}}";
  }

  public ConnectAction bridge(String number) {
    return new ConnectAction.Builder().build();
  }

  // Local methods whose names echo recording APIs, and calls to them.
  public void tidy() {
    startRoomCompositeEgress("main");
    createMediaCapturePipeline("p1");
    startContactRecording("c1");
  }

  public void startRoomCompositeEgress(String room) {
    System.out.println("composite layout for " + room);
  }

  public void createMediaCapturePipeline(String id) {
    System.out.println("pipeline label " + id);
  }

  public void startContactRecording(String id) {
    System.out.println("contact " + id);
  }
}
