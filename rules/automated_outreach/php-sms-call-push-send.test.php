<?php
// lexcode-expect: 10
// Texts, calls and pushes: Twilio messages (by number and by messaging service) and calls, Vonage SMS,
// Amazon SNS to a phone number, a Symfony Notifier texter, a send_sms helper, a Firebase Cloud
// Messaging push and Web Push.
namespace App\Services;

use Minishlink\WebPush\WebPush;
use Symfony\Component\Notifier\Message\SmsMessage;

final class Alerts
{
    public function outbreak(Resident $resident): void
    {
        $this->twilio->messages->create($resident->phone, ['from' => '+15005550006', 'body' => 'A boil-water notice is in effect.']);
        $this->twilio->messages->create(
            $resident->phone,
            ['messagingServiceSid' => 'MG0000000000', 'body' => 'Shelters are open at the high school.']
        );
        $this->twilio->calls->create($resident->phone, '+15005550006', ['url' => 'https://example.com/notice.xml']);
        $this->vonage->sms()->send(new SMS($resident->phone, 'CITY', 'Road closures tonight.'));
        $this->sns->publish(['PhoneNumber' => $resident->phone, 'Message' => 'Road closures tonight.']);
        $this->texter->send(new SmsMessage($resident->phone, 'Road closures tonight.'));
        $this->gateway->sendSms($resident->phone, 'Road closures tonight.');
        send_sms($resident->phone, 'Road closures tonight.');
        $this->messaging->send(CloudMessage::withTarget('token', $resident->deviceToken));
        (new WebPush($this->vapid))->sendOneNotification($resident->subscription(), 'Road closures tonight.');
    }
}
