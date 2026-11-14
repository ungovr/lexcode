<?php
// lexcode-expect: 0
// Not outreach: a one-time sign-in code by text, a verification started with Twilio Verify, a password
// reset text, a Messenger bus dispatch, an HTTP response sent, and a message list read from Twilio.
namespace App\Http\Controllers;

final class LoginController
{
    public function sendCode(Request $request)
    {
        $code = random_int(100000, 999999);
        $this->twilio->messages->create($request->input('phone'), ['from' => '+15005550006', 'body' => "Your sign-in code is $code"]);
        $this->twilio->verify->v2->services('VA0000000000')->verifications->create($request->input('phone'), 'sms');
        $this->vonage->sms()->send(new SMS($request->input('phone'), 'APP', 'Your password reset link: '.$this->link()));
        $this->bus->dispatch(new LoginAttempted($request->input('phone')));
        return response()->json(['sent' => true])->send();
    }

    public function history()
    {
        return $this->twilio->messages->read(['to' => '+15005550006'], 20);
    }
}
