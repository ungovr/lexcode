# lexcode-expect: 3
# Recording a LiveKit room from Python: egress writes the call to a file.
from livekit import api


async def record_room(room_name):
    lkapi = api.LiveKitAPI()
    request = api.RoomCompositeEgressRequest(
        room_name=room_name,
        layout="speaker",
        file_outputs=[api.EncodedFileOutput(filepath=f"calls/{room_name}.mp4")],
    )
    info = await lkapi.egress.start_room_composite_egress(request)
    await lkapi.aclose()
    return info.egress_id


async def record_participant(room_name, identity):
    lkapi = api.LiveKitAPI()
    request = api.ParticipantEgressRequest(room_name=room_name, identity=identity)
    return await lkapi.egress.start_participant_egress(request)


async def record_one_track(room_name, track_id):
    lkapi = api.LiveKitAPI()
    request = api.TrackEgressRequest(room_name=room_name, track_id=track_id)
    return await lkapi.egress.start_track_egress(request)
