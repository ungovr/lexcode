<?php
// lexcode-expect: 8
// Sends from a scheduler that no user action triggers: Laravel scheduler closures ($schedule->call,
// and the Schedule facade under its import and fully qualified) and Symfony Scheduler tasks
// (#[AsCronTask] and #[AsPeriodicTask], on a class and on a method, under an import, an alias and
// fully qualified). The Schedule facade under an alias is in php-send-in-scheduled-job.test.alias.php,
// because the short-name branch steps aside in a file that also imports the class under an alias.
namespace App\Console;

use Illuminate\Console\Scheduling\Schedule as ConsoleSchedule;
use Illuminate\Support\Facades\Schedule;
use Illuminate\Support\Facades\Mail;
use Symfony\Component\Scheduler\Attribute\AsCronTask;
use Symfony\Component\Scheduler\Attribute\AsPeriodicTask as Every;
use App\Mail\RenewalDue;

class Kernel
{
    protected function schedule(ConsoleSchedule $schedule): void
    {
        $schedule->call(function () {
            Mail::to(User::dueForRenewal()->pluck('email'))->send(new RenewalDue());
        })->dailyAt('08:00');

        Schedule::call(function () {
            $this->mailer->send($this->buildDigest());
        })->weekly();

        \Illuminate\Support\Facades\Schedule::call(function () {
            send_overdue_notifications();
        })->daily();
    }
}

#[AsCronTask('0 9 * * 1')]
final class WeeklyNewsletter
{
    public function __invoke(): void
    {
        $this->mailer->send($this->newsletter->compose());
    }
}

#[\Symfony\Component\Scheduler\Attribute\AsCronTask('0 7 * * *')]
final class MorningTexts
{
    public function __invoke(): void
    {
        $this->texter->send(new SmsMessage($this->subscriber->phone, 'Good morning from the clinic.'));
    }
}

final class Reminders
{
    #[Every('1 day')]
    public function remind(): void
    {
        $this->notifier->send(new Notification('Your appointment is tomorrow.'), $this->recipient);
    }

    #[AsCronTask('30 6 * * *')]
    public function lapsed(): void
    {
        mail($this->member->email, 'We miss you', 'Come back for 20% off.');
    }

    #[\Symfony\Component\Scheduler\Attribute\AsPeriodicTask(frequency: '1 week')]
    public function feedback(): void
    {
        $this->users->first()->notify(new FeedbackRequest());
    }
}
