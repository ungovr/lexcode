<?php
// lexcode-expect: 0
// Not outreach: a single email a person writes and sends by hand, one transactional message per
// request, a loop that builds one message's recipient list and sends once, loops over relays and
// retry attempts, an app's own Mail class in another namespace, Filament's Notification toast in a
// loop, and a loop that only dispatches to a bus and logs.
namespace App\Http\Controllers;

use App\Support\Mail;
use Filament\Notifications\Notification;
use Symfony\Component\Mime\Email;

final class AccountController
{
    public function register(Request $request)
    {
        $user = User::create($request->validated());
        $this->mailer->send((new Email())->to($user->email)->subject('Welcome')->text('Thanks for joining.'));
        return redirect('/');
    }

    public function staffReply(Request $request, Ticket $ticket)
    {
        // A staff member writes this reply and sends it by hand.
        $this->mailer->send((new Email())->to($ticket->requester)->text($request->input('body')));
        return back();
    }

    public function shareList(Request $request)
    {
        $email = (new Email())->subject('Shared list')->text($request->input('body'));
        foreach ($request->input('recipients') as $address) {
            $email->addTo($address);
        }
        $this->mailer->send($email);
    }

    public function viaRelays(Email $email): void
    {
        foreach ($this->relays as $relay) {
            $this->mailer->send($email);
        }
        for ($attempt = 1; $attempt <= 3; $attempt++) {
            $this->mailer->send($email);
        }
    }

    public function archive(array $threads): void
    {
        foreach ($threads as $thread) {
            Mail::to($thread)->archive();
        }
    }

    public function saveItems(array $items): void
    {
        foreach ($items as $item) {
            $item->save();
            Notification::make()->title('Saved '.$item->name)->success()->send();
        }
    }

    public function audit(array $events): void
    {
        foreach ($events as $event) {
            $this->bus->dispatch(new AuditEvent($event));
            $this->logger->info('recorded', ['event' => $event->id]);
        }
    }
}
