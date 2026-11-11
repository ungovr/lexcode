// lexcode-expect: 0
// Video and meeting platform code that carries or reads a call without recording it: a
// LiveKit token and room listing, a Chime meeting without a capture pipeline, a Zoom meetings
// lookup that never touches recordings, a Daily room with recording off, and a Vonage connect
// action, with the vendor types written in full and no vendor import. A local archive has
// startRoomCompositeEgress, startParticipantEgress, startTrackCompositeEgress,
// startTrackEgress, createMediaCapturePipeline and startContactRecording methods of its own
// and calls them on a receiver, and a RecordAction with a builder() of its own.
package demo.meetings

class MeetingDesk(private val rooms: io.livekit.server.RoomServiceClient) {
    private val chime = software.amazon.awssdk.services.chimesdkmeetings.ChimeSdkMeetingsClient.create()

    fun joinToken(key: String, secret: String, identity: String): String {
        val token = io.livekit.server.AccessToken(key, secret)
        token.identity = identity
        return token.toJwt()
    }

    fun listRooms(): Any = rooms.listRooms().execute()

    fun startMeeting(token: String): Any =
        chime.createMeeting(
            software.amazon.awssdk.services.chimesdkmeetings.model.CreateMeetingRequest.builder().clientRequestToken(token).build(),
        )

    fun zoomMeetingList(): String = "https://api.zoom.us/v2/users/me/meetings"

    fun zoomMeeting(id: String): String = "https://api.zoom.us/v2/meetings/$id"

    fun dailyRoomWithoutRecording(): String = "{\"properties\":{\"enable_chat\":true,\"enable_recording\":\"off\"}}"

    fun dailyMap(): Map<String, Any> = mapOf("enable_chat" to true, "enable_recording" to "off")

    fun bridge(): Any = com.vonage.client.voice.ncco.ConnectAction.Builder().build()
}

// A local meeting archive that shares method names with the recording APIs.
class MeetingArchive(private val archive: Archive) {
    fun tidy(id: String) {
        archive.startRoomCompositeEgress(id)
        archive.startParticipantEgress(id)
        archive.startTrackCompositeEgress(id)
        archive.startTrackEgress(id)
        archive.createMediaCapturePipeline(id)
        archive.startContactRecording(id)
        archive.startContactRecording { id }
    }

    fun prompt(): Any = RecordAction.Builder().build()

    fun prompt2(): Any = RecordAction.builder().build()
}

interface Archive {
    fun startRoomCompositeEgress(id: String)

    fun startParticipantEgress(id: String)

    fun startTrackCompositeEgress(id: String)

    fun startTrackEgress(id: String)

    fun createMediaCapturePipeline(id: String)

    fun startContactRecording(id: String)

    fun startContactRecording(block: () -> String)
}

class RecordAction {
    companion object {
        fun builder(): Builder = Builder()
    }

    class Builder {
        fun build(): Any = Any()
    }
}
