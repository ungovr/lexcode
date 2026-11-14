<?php
// lexcode-expect: 5
// Recording calls with the Twilio PHP SDK: placing a call with recording on, through the
// shorthand and the full API path, starting a recording on a live call, and opening a group
// video room that records every participant.
namespace App\Telephony;

use Twilio\Rest\Client as TwilioClient;

class Recorder
{
    private TwilioClient $twilio;

    public function __construct(string $sid, string $token)
    {
        $this->twilio = new TwilioClient($sid, $token);
    }

    public function place(string $to, string $from): string
    {
        $call = $this->twilio->calls->create($to, $from, [
            'url' => 'https://example.org/twiml/support',
            'record' => true,
            'recordingStatusCallback' => 'https://example.org/hooks/recording',
        ]);
        $dual = $this->twilio->api->v2010->calls->create($to, $from, ['url' => 'https://example.org/twiml', 'record' => 'true']);
        return $call->sid . $dual->sid;
    }

    public function startRecording(string $callSid): void
    {
        $this->twilio->calls($callSid)->recordings->create(['recordingChannels' => 'dual']);
    }

    public function room(string $name): string
    {
        $room = $this->twilio->video->v1->rooms->create([
            'uniqueName' => $name,
            'type' => 'group',
            'recordParticipantsOnConnect' => true,
        ]);
        $other = $this->twilio->video->rooms->create(['recordParticipantsOnConnect' => $this->policy()]);
        return $room->sid . $other->sid;
    }

    private function policy(): bool
    {
        return true;
    }
}
