<?php
// lexcode-expect: 0
// TwiML that greets, forwards and bridges a call without recording it, a Dial that says not to
// record, and look-alikes: the app's own VoiceResponse class in another namespace, imported and
// written in full, with a record method of its own, and an audit log that has a record method.
namespace App\Http\Controllers;

use App\Telephony\VoiceResponse;
use Twilio\TwiML\VoiceResponse as Twiml;

class ForwardController
{
    public function __construct(private $audit)
    {
    }

    public function forward(string $number): string
    {
        $response = new Twiml();
        $response->say('Connecting you to the front desk.');
        $response->gather(['input' => 'dtmf', 'numDigits' => 1]);
        $response->dial($number, ['callerId' => '+15555550100', 'timeout' => 20]);
        $dial = $response->dial('', ['record' => 'do-not-record']);
        $dial->conference('Front desk', ['startConferenceOnEnter' => true]);
        $this->audit->record('call.forwarded', ['to' => $number]);
        return (string) $response;
    }

    public function local(): string
    {
        $own = new VoiceResponse();
        $own->record(['take' => 1]);
        $full = new \App\Telephony\VoiceResponse();
        $full->record(['take' => 2]);
        return $own . $full;
    }
}
