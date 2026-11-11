// lexcode-expect: 13
// Recording or reading recorded calls and meetings from Kotlin: LiveKit egress in its four
// forms, an Amazon Chime media capture pipeline and Amazon Connect contact recording through
// the AWS SDK for Kotlin, a Vonage record action, the Zoom cloud-recording API, notetaker bots
// sent into meetings, and a Daily room with cloud recording written as JSON and as a map.
package demo.meetings

import aws.sdk.kotlin.services.chimesdkmediapipelines.ChimeSdkMediaPipelinesClient
import aws.sdk.kotlin.services.connect.ConnectClient
import com.vonage.client.voice.ncco.RecordAction
import io.livekit.server.EgressServiceClient

class MeetingArchive(
    private val egress: EgressServiceClient,
    private val pipelines: ChimeSdkMediaPipelinesClient,
    private val connect: ConnectClient,
) {
    fun recordRoom(room: String, output: Any): Any = egress.startRoomCompositeEgress(room, null, "grid").execute()

    fun recordPerson(room: String, identity: String): Any = egress.startParticipantEgress(room, identity, null, null).execute()

    fun recordComposite(room: String, audioTrack: String, videoTrack: String): Any =
        egress.startTrackCompositeEgress(room, null, audioTrack, videoTrack).execute()

    fun recordTrack(room: String, trackId: String): Any = egress.startTrackEgress(room, null, trackId).execute()

    suspend fun captureMeeting() {
        pipelines.createMediaCapturePipeline {
            sourceType = null
        }
    }

    suspend fun recordContact(contact: String) {
        connect.startContactRecording {
            contactId = contact
        }
    }

    fun voicemailPrompt(): RecordAction = RecordAction.Builder().beepStart(true).build()

    fun zoomRecordings(meetingId: String): String = "https://api.zoom.us/v2/meetings/$meetingId/recordings"

    fun notetakerBot(): String = "https://us-east-1.recall.ai/api/v1/bot/"

    fun meetingBaas(): String = "https://api.meetingbaas.com/bots"

    fun attendeeBot(): String = "https://app.attendee.dev/api/v1/bots"

    fun dailyCloudRecording(): String = "{\"properties\":{\"enable_recording\":\"cloud\"}}"

    fun dailyMap(): Map<String, Any> = mapOf("enable_chat" to true, "enable_recording" to "cloud")
}
