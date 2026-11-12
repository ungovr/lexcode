<?php
// lexcode-expect: 10
// Sends from work that runs off a request: Laravel queued jobs (ShouldQueue under an alias and fully
// qualified), Symfony event subscribers (imported and fully qualified), Messenger handlers and event
// listeners by attribute (aliased, fully qualified and imported), and methods named for notifying. A
// send inside a queued job's notifier-named method is one match, not two.
namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue as Queued;
use Illuminate\Support\Facades\Mail;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\Messenger\Attribute\AsMessageHandler as Handles;
use Symfony\Component\EventDispatcher\Attribute\AsEventListener;

final class SendWelcomePack implements Queued
{
    public function handle(): void
    {
        Mail::to($this->user)->send(new WelcomePack($this->user));
    }

    public function remindLater(): void
    {
        Mail::to($this->user)->later(now()->addDay(), new WelcomePack($this->user));
    }
}

final class SendInvoice implements \Illuminate\Contracts\Queue\ShouldQueue
{
    public function handle(): void
    {
        $this->user->notify(new InvoiceReady($this->invoice));
    }
}

final class CommentSubscriber implements EventSubscriberInterface
{
    public static function getSubscribedEvents(): array
    {
        return [CommentCreated::class => 'onCommentCreated'];
    }

    public function onCommentCreated(CommentCreated $event): void
    {
        $this->mailer->send($this->emailFor($event->getComment()));
    }
}

final class ShippingSubscriber implements \Symfony\Component\EventDispatcher\EventSubscriberInterface
{
    public static function getSubscribedEvents(): array
    {
        return [OrderShipped::class => 'onShipped'];
    }

    public function onShipped(OrderShipped $event): void
    {
        $this->texter->send(new SmsMessage($event->phone(), 'Your order is on its way.'));
    }
}

#[Handles]
final class ReminderHandler
{
    public function __invoke(SendReminder $message): void
    {
        $this->mailer->send($message->email());
    }
}

final class Handlers
{
    #[\Symfony\Component\Messenger\Attribute\AsMessageHandler]
    public function onSignup(UserSignedUp $message): void
    {
        $this->twilio->messages->create($message->phone, ['from' => '+15005550006', 'body' => 'Welcome aboard.']);
    }

    #[AsEventListener(event: 'order.paid')]
    public function onPaid(OrderPaid $event): void
    {
        mail($event->email, 'Payment received', 'Thanks for your order.');
    }
}

final class AccountService
{
    public function notifyStatusChange(Account $account): void
    {
        $this->mailer->send($this->statusMail($account));
    }

    public function sendDailyDigest(User $user): void
    {
        $this->mailer->send($this->digest($user));
    }
}
