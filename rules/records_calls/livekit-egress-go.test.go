// lexcode-expect: 2
// Recording a LiveKit room from Go: egress writes the call to a file.
package calls

import (
	"context"

	"github.com/livekit/protocol/livekit"
	lksdk "github.com/livekit/server-sdk-go/v2"
)

func RecordRoom(ctx context.Context, client *lksdk.EgressClient, room string) (string, error) {
	info, err := client.StartRoomCompositeEgress(ctx, &livekit.RoomCompositeEgressRequest{
		RoomName: room,
		Layout:   "speaker",
		Output: &livekit.RoomCompositeEgressRequest_File{
			File: &livekit.EncodedFileOutput{Filepath: "calls/" + room + ".mp4"},
		},
	})
	if err != nil {
		return "", err
	}
	return info.EgressId, nil
}

func RecordParticipant(ctx context.Context, client *lksdk.EgressClient, room, identity string) error {
	_, err := client.StartParticipantEgress(ctx, &livekit.ParticipantEgressRequest{
		RoomName: room,
		Identity: identity,
	})
	return err
}
