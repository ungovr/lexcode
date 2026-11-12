<?php
// lexcode-expect: 4
// Taking a caller's speech through Twilio TwiML from PHP: a Gather that listens for speech,
// alone or beside the keypad, and a Record verb that has Twilio transcribe the voicemail.
namespace App\Http\Controllers;

use Twilio\TwiML\VoiceResponse;

class VoiceController
{
    public function ask(): string
    {
        $response = new VoiceResponse();
        $response->gather(['input' => 'speech', 'action' => '/voice/answer', 'speechTimeout' => 'auto']);
        $gather = $response->gather([
            "input" => "dtmf speech",
            "hints" => "permit, inspection",
        ]);
        $gather->say('Say or press the department you want.');
        return (string) $response;
    }

    public function voicemail(): string
    {
        $response = new VoiceResponse();
        $response->say('Leave a message after the tone.');
        $response->record(['maxLength' => 120, 'transcribe' => 'true', 'transcribeCallback' => '/voice/transcript']);
        $response->record(['transcribe' => true]);
        return (string) $response;
    }
}
