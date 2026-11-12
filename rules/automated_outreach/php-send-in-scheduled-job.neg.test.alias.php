<?php
// lexcode-expect: 0
// Laravel's Schedule, Mail and Notification facades and Symfony's scheduler attributes imported
// under aliases, and the app's own classes of the same short names used by those names: a Schedule
// class whose call() runs a callback now, scheduler-named attributes of the app's own, and Mail and
// Notification classes that build in-app records. The engine's `use X;` also matches `use X as Y;`,
// so each short-name branch has to step aside where the class is aliased.
namespace App\Console;

use App\Attribute\AsCronTask;
use App\Attribute\AsPeriodicTask;
use App\Support\Mail;
use App\Support\Notification;
use App\Support\Schedule;
use Illuminate\Support\Facades\Mail as MailFacade;
use Illuminate\Support\Facades\Notification as NotificationFacade;
use Illuminate\Support\Facades\Schedule as ScheduleFacade;
use Symfony\Component\Scheduler\Attribute\AsCronTask as CronTask;
use Symfony\Component\Scheduler\Attribute\AsPeriodicTask as PeriodicTask;

class Kernel
{
    protected function schedule($schedule): void
    {
        Schedule::call(function () {
            mail($this->owner->email, 'Report ready', 'Your report is ready.');
        });

        $schedule->call(function () {
            Mail::to($this->inbox)->queue($this->draft);
            Notification::send($this->board, $this->card);
        })->daily();
    }
}

#[AsCronTask('0 9 * * 1')]
final class WeeklyReport
{
    public function __invoke(): void
    {
        mail($this->owner->email, 'Report ready', 'Your report is ready.');
    }
}

final class Reports
{
    #[AsPeriodicTask('1 day')]
    public function build(): void
    {
        mail($this->owner->email, 'Report ready', 'Your report is ready.');
    }
}
