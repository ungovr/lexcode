// lexcode-expect: 7
// Recording or reading recorded calls and meetings from Java: a LiveKit egress, an
// Amazon Chime media capture pipeline, Amazon Connect contact recording, a Vonage record
// action, the Zoom cloud-recording API, a notetaker bot sent into a meeting, and a Daily
// room with cloud recording.
package demo.meetings;

import com.vonage.client.voice.ncco.RecordAction;
import io.livekit.server.EgressServiceClient;
import software.amazon.awssdk.services.chimesdkmediapipelines.ChimeSdkMediaPipelinesClient;
import software.amazon.awssdk.services.chimesdkmediapipelines.model.CreateMediaCapturePipelineRequest;
import software.amazon.awssdk.services.connect.ConnectClient;
import software.amazon.awssdk.services.connect.model.StartContactRecordingRequest;

public class MeetingArchive {
  private final EgressServiceClient egress;
  private final ChimeSdkMediaPipelinesClient pipelines = ChimeSdkMediaPipelinesClient.create();
  private final ConnectClient connect = ConnectClient.create();

  public MeetingArchive(EgressServiceClient egress) {
    this.egress = egress;
  }

  public Object recordRoom(String room, Object output) throws Exception {
    return egress.startRoomCompositeEgress(room, null, "grid").execute();
  }

  public Object captureMeeting(CreateMediaCapturePipelineRequest request) {
    return pipelines.createMediaCapturePipeline(request);
  }

  public Object recordContact(StartContactRecordingRequest request) {
    return connect.startContactRecording(request);
  }

  public RecordAction voicemailPrompt() {
    return new RecordAction.Builder().beepStart(true).build();
  }

  public String zoomRecordings(String meetingId) {
    return String.format("https://api.zoom.us/v2/meetings/%s/recordings", meetingId);
  }

  public String notetakerBot() {
    return "https://us-east-1.recall.ai/api/v1/bot/";
  }

  public String dailyCloudRecording() {
    return "{\"properties\":{\"enable_recording\":\"cloud\"}}";
  }
}
