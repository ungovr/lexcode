# lexcode-expect: 0
# Running a LiveKit room without recording: tokens, room admin, and stopping an egress.
from livekit import api


def join_token(room_name, identity):
    token = api.AccessToken().with_identity(identity).with_grants(api.VideoGrants(room_join=True, room=room_name))
    return token.to_jwt()


async def close_room(room_name):
    lkapi = api.LiveKitAPI()
    await lkapi.room.delete_room(api.DeleteRoomRequest(room=room_name))
    await lkapi.aclose()


async def stop_recording(egress_id):
    lkapi = api.LiveKitAPI()
    await lkapi.egress.stop_egress(api.StopEgressRequest(egress_id=egress_id))
    await lkapi.aclose()
