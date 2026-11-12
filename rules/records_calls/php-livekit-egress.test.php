<?php
// lexcode-expect: 4
// Starting LiveKit egress from PHP, which records the people in a room: the whole room
// composited, one participant, a composite of tracks, and a single track.
namespace App\Rooms;

use Agence104\LiveKit\EgressServiceClient;
use Livekit\EncodedFileOutput;

class RoomRecorder
{
    public function __construct(private EgressServiceClient $egress)
    {
    }

    public function record(string $room, string $identity, string $audioTrack, string $videoTrack): array
    {
        $file = (new EncodedFileOutput())->setFilepath("recordings/{$room}.mp4");
        return [
            $this->egress->startRoomCompositeEgress($room, 'grid', $file),
            $this->egress->startParticipantEgress($room, $identity, $file),
            $this->egress->startTrackCompositeEgress($room, $file, $audioTrack, $videoTrack),
            $this->egress->startTrackEgress($room, "recordings/{$audioTrack}.ogg", $audioTrack),
        ];
    }
}
