<?php
// lexcode-expect: 0
// Twilio calls that only carry a conversation from one person to another, without keeping it:
// a call placed with no recording, one with recording turned off, a video room that does not
// record, a text message, and hanging up a live call. A CRM of the app's own logs a call
// record with calls->create, which takes one array and is not Twilio's three-argument create.
namespace App\Telephony;

use Twilio\Rest\Client;

class Dialer
{
    public function __construct(private Client $twilio, private $crm)
    {
    }

    public function connect(string $to, string $from): string
    {
        $plain = $this->twilio->calls->create($to, $from, ['url' => 'https://example.org/twiml/bridge']);
        $off = $this->twilio->calls->create($to, $from, ['url' => 'https://example.org/twiml/bridge', 'record' => false]);
        $string = $this->twilio->calls->create($to, $from, ['twiml' => '<Response><Dial/></Response>', 'record' => 'false']);
        $room = $this->twilio->video->v1->rooms->create(['uniqueName' => 'standup', 'recordParticipantsOnConnect' => false]);
        $this->twilio->messages->create($to, ['from' => $from, 'body' => 'Your callback is booked.']);
        $this->twilio->calls($plain->sid)->update(['status' => 'completed']);
        $this->crm->calls->create(['subject' => 'Follow-up', 'record' => $room->sid]);
        return $plain->sid . $off->sid . $string->sid;
    }
}
