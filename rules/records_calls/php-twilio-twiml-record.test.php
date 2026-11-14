<?php
// lexcode-expect: 4
// Answering a Twilio call with TwiML that records it, from PHP: a Record verb, a Dial that
// records the bridged call, and a conference that records from the start. The VoiceResponse is
// imported and written in full; the aliased import is in php-twilio-twiml-record.test.alias.php.
namespace App\Http\Controllers;

use Twilio\TwiML\VoiceResponse;

class SupportLineController
{
    public function voicemail(): string
    {
        $response = new VoiceResponse();
        $response->say('Leave a message after the tone.');
        $response->record(['maxLength' => 120, 'playBeep' => true]);
        return (string) $response;
    }

    public function bridge(string $agent): string
    {
        $response = new VoiceResponse();
        $dial = $response->dial('', ['record' => 'record-from-answer-dual']);
        $dial->number($agent);
        return (string) $response;
    }

    public function conference(string $room): string
    {
        $response = new \Twilio\TwiML\VoiceResponse();
        $dial = $response->dial();
        $dial->conference($room, ['record' => 'record-from-start', 'startConferenceOnEnter' => true]);
        return (string) $response;
    }

    public function fallback(): string
    {
        $full = new \Twilio\TwiML\VoiceResponse();
        $full->say('All lines are busy.');
        $full->record(['timeout' => 5]);
        $full->hangup();
        return (string) $full;
    }
}
