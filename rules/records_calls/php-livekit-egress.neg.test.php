<?php
// lexcode-expect: 0
// LiveKit calls that carry a room without recording it: creating a room, minting a join token,
// listing participants, and listing and stopping egress that something else started.
namespace App\Rooms;

use Agence104\LiveKit\AccessToken;
use Agence104\LiveKit\AccessTokenOptions;
use Agence104\LiveKit\EgressServiceClient;
use Agence104\LiveKit\RoomCreateOptions;
use Agence104\LiveKit\RoomServiceClient;
use Agence104\LiveKit\VideoGrant;

class LiveRoom
{
    public function __construct(private RoomServiceClient $rooms, private EgressServiceClient $egress)
    {
    }

    public function open(string $name, string $identity): string
    {
        $this->rooms->createRoom((new RoomCreateOptions())->setName($name)->setEmptyTimeout(600));
        $this->rooms->listParticipants($name);
        $grant = (new VideoGrant())->setRoomJoin()->setRoomName($name);
        return (new AccessToken())->init((new AccessTokenOptions())->setIdentity($identity))->setGrant($grant)->toJwt();
    }

    public function stopAll(string $name): void
    {
        foreach ($this->egress->listEgress($name)->getItems() as $item) {
            $this->egress->stopEgress($item->getEgressId());
        }
    }
}
