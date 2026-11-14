<?php
// lexcode-expect: 3
// Recording TwiML built on Twilio's VoiceResponse imported under an alias: a Record verb, a
// Dial that records, and a conference reached from that Dial.
namespace App\Http\Controllers;

use Twilio\TwiML\VoiceResponse as Twiml;

class AfterHoursController
{
    public function voicemail(): string
    {
        $response = new Twiml();
        $response->say('The office is closed. Leave a message.');
        $response->record();
        return (string) $response;
    }

    public function oncall(string $number, string $room): string
    {
        $response = new Twiml();
        $response->dial($number, ['record' => 'record-from-ringing']);
        $dial = $response->dial();
        $dial->conference($room, ['record' => 'record-from-start']);
        return (string) $response;
    }
}
