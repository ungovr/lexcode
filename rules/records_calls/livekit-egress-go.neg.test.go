// lexcode-expect: 0
// Running a LiveKit room without recording it: room admin and stopping an egress.
package calls

import (
	"context"

	"github.com/livekit/protocol/livekit"
	lksdk "github.com/livekit/server-sdk-go/v2"
)

func CloseRoom(ctx context.Context, client *lksdk.RoomServiceClient, room string) error {
	_, err := client.DeleteRoom(ctx, &livekit.DeleteRoomRequest{Room: room})
	return err
}

func StopRecording(ctx context.Context, client *lksdk.EgressClient, id string) error {
	_, err := client.StopEgress(ctx, &livekit.StopEgressRequest{EgressId: id})
	return err
}

func Participants(ctx context.Context, client *lksdk.RoomServiceClient, room string) ([]string, error) {
	reply, err := client.ListParticipants(ctx, &livekit.ListParticipantsRequest{Room: room})
	if err != nil {
		return nil, err
	}
	names := make([]string, 0, len(reply.Participants))
	for _, p := range reply.Participants {
		names = append(names, p.Identity)
	}
	return names, nil
}
