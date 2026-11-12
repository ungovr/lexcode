<?php
// lexcode-expect: 0
// Not a send from background work: a queued job and a message handler that send nothing, Symfony and
// Laravel console commands an operator runs to mail one report to the address they name, an app's own
// ShouldQueue and Command and an app's own AsMessageHandler attribute in other namespaces with a send
// under them, a request handler that mails the person who asked, and a subscriber that logs.
namespace App\Jobs;

use App\Contracts\ShouldQueue;
use App\Console\Command;
use App\Attribute\AsMessageHandler;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\Mime\Email;

final class ResizeImage implements \Illuminate\Contracts\Queue\ShouldQueue
{
    public function handle(): void
    {
        $this->image->resize(800, 600)->save();
    }
}

final class LocalJob implements ShouldQueue
{
    public function handle(): void
    {
        $this->mailer->send($this->summary);
    }
}

final class ListUsers extends Command
{
    public function handle(): int
    {
        $this->mailer->send($this->table);
        return 0;
    }
}

final class ExportUsers extends \Symfony\Component\Console\Command\Command
{
    protected function execute($input, $output): int
    {
        // An operator runs this and names the one address the report goes to.
        $this->mailer->send($this->exportMail($input->getOption('send-to')));
        return 0;
    }
}

final class MailReport extends \Illuminate\Console\Command
{
    public function handle(): int
    {
        \Illuminate\Support\Facades\Mail::to($this->argument('to'))->send(new UsageReport());
        return 0;
    }
}

#[AsMessageHandler]
final class LocalHandler
{
    public function __invoke(Ping $message): void
    {
        $this->mailer->send($message->email());
    }
}

#[\Symfony\Component\Messenger\Attribute\AsMessageHandler]
final class ThumbnailHandler
{
    public function __invoke(MakeThumbnail $message): void
    {
        $this->thumbnails->make($message->path());
    }
}

final class AuditSubscriber implements EventSubscriberInterface
{
    public static function getSubscribedEvents(): array
    {
        return [OrderPaid::class => 'onPaid'];
    }

    public function onPaid(OrderPaid $event): void
    {
        $this->logger->info('order paid', ['id' => $event->id()]);
    }
}

final class PasswordController
{
    public function reset(Request $request)
    {
        $this->mailer->send((new Email())->to($request->input('email'))->subject('Reset your password'));
        return back();
    }
}
