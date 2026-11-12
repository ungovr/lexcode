<?php
// lexcode-expect: 15
// One message to many recipients in one call: Laravel's Notification facade to a collection (under an
// alias, fully qualified and as the global alias), Amazon SES bulk sends, Firebase multicast, a
// Mailchimp campaign, Twilio Notify, Postmark and Resend batches, a Brevo campaign and a Mailgun batch.
namespace App\Services;

use Illuminate\Support\Facades\Notification as Notifier;
use App\Notifications\ProductLaunch;

final class Announcements
{
    public function launch(): void
    {
        Notifier::send(User::all(), new ProductLaunch());
        \Illuminate\Support\Facades\Notification::send($this->subscribers, new ProductLaunch());
        \Notification::sendNow(User::where('opted_in', true)->get(), new ProductLaunch());
    }

    public function ses(SesClient $ses, SesV2Client $sesV2): void
    {
        $ses->sendBulkTemplatedEmail(['Source' => 'news@example.com', 'Template' => 'launch', 'Destinations' => $this->destinations()]);
        $sesV2->sendBulkEmail(['FromEmailAddress' => 'news@example.com', 'BulkEmailEntries' => $this->entries()]);
    }

    public function push(Messaging $messaging): void
    {
        $messaging->sendMulticast($this->launchMessage(), $this->deviceTokens());
        $this->firebaseMessaging->sendAll($this->messages());
        $messaging->sendEach($this->messages());
    }

    public function vendors(): void
    {
        $this->mailchimp->campaigns->send('b03bfc2ca6');
        $this->twilio->notify->v1->services('IS0000000000')->notifications->create(['toBinding' => $this->bindings(), 'body' => 'We launched.']);
        $this->postmark->sendEmailBatch($this->batch());
        $this->postmark->sendEmailBatchWithTemplates($this->templatedBatch());
        $this->resend->batch->send($this->emails());
        $this->brevo->sendEmailCampaignNow(42);
        $this->mailgun->messages()->send('mg.example.com', [
            'from' => 'news@example.com',
            'to' => $this->addresses(),
            'subject' => 'Hello %recipient.first%',
            'recipient-variables' => json_encode($this->variables()),
        ]);
    }
}
