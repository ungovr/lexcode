<?php
// lexcode-expect: 0
// Laravel's ShouldQueue, Mail and Notification and Symfony's subscriber interface and handler and
// listener attributes imported under aliases, and the app's own classes of the same short names used
// by those names. The engine's `use X;` also matches `use X as Y;`, so each short-name branch has to
// step aside where the class is aliased.
namespace App\Jobs;

use App\Attribute\AsEventListener;
use App\Attribute\AsMessageHandler;
use App\Contracts\EventSubscriberInterface;
use App\Contracts\ShouldQueue;
use App\Support\Mail;
use App\Support\Notification;
use Illuminate\Contracts\Queue\ShouldQueue as Queued;
use Illuminate\Support\Facades\Mail as MailFacade;
use Illuminate\Support\Facades\Notification as NotificationFacade;
use Symfony\Component\EventDispatcher\Attribute\AsEventListener as Listener;
use Symfony\Component\EventDispatcher\EventSubscriberInterface as Subscriber;
use Symfony\Component\Messenger\Attribute\AsMessageHandler as Handler;

// The app's own ShouldQueue marker: the class runs inline, when a person asks for the export.
class ExportReport implements ShouldQueue
{
    public function handle(): void
    {
        mail($this->owner->email, 'Your export', $this->body);
    }
}

class AuditSubscriber implements EventSubscriberInterface
{
    public function onAudit(): void
    {
        mail($this->owner->email, 'Audit entry', $this->body);
    }
}

#[AsMessageHandler]
class ExportHandler
{
    public function __invoke(): void
    {
        mail($this->owner->email, 'Your export', $this->body);
    }
}

#[AsEventListener(event: 'export.done')]
class ExportListener
{
    public function __invoke(): void
    {
        mail($this->owner->email, 'Your export', $this->body);
    }
}

// A queued job, written in full, that builds in-app records with the app's own Mail and
// Notification classes.
class RebuildInbox implements \Illuminate\Contracts\Queue\ShouldQueue
{
    public function handle(): void
    {
        Mail::queue($this->draft);
        Notification::send($this->board, $this->card);
    }
}
