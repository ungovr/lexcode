<?php
// lexcode-expect: 0
// TwiML that talks to a caller without taking their speech: a keypad menu that gathers digits
// only, a spoken greeting (text to speech) and a hold tune. A form helper of the app's own has
// a gather method with an input key that holds form data, not a speech mode.
namespace App\Http\Controllers;

use Twilio\TwiML\VoiceResponse;

class MenuController
{
    public function menu(): string
    {
        $response = new VoiceResponse();
        $response->say('Thanks for calling the clerk. Press 1 for permits.', ['voice' => 'alice']);
        $response->gather(['input' => 'dtmf', 'numDigits' => 1, 'action' => '/ivr/choice']);
        $response->play('https://example.org/hold.mp3');
        return (string) $response;
    }

    public function collect($form, $request): array
    {
        return $form->gather(['input' => $request->all(), 'rules' => ['email' => 'required']]);
    }
}
