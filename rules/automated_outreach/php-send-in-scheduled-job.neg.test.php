<?php
// lexcode-expect: 0
// Not outreach from a timer: scheduled work that sends nothing, a scheduler entry that names a
// command, a send in a request handler for the person who asked, and an app's own Schedule class and
// AsCronTask attribute in another namespace with a send under them.
namespace App\Console;

use Illuminate\Console\Scheduling\Schedule as ConsoleSchedule;
use App\Support\Schedule;
use App\Attribute\AsCronTask;
use Symfony\Component\Mime\Email;

class Kernel
{
    protected function schedule(ConsoleSchedule $schedule): void
    {
        $schedule->call(function () {
            Session::where('expires_at', '<', now())->delete();
        })->hourly();
        $schedule->command('backup:run')->daily();

        Schedule::call(function () {
            $this->mailer->send($this->receipt);
        });
    }
}

#[AsCronTask('0 3 * * *')]
final class Housekeeping
{
    public function __invoke(): void
    {
        $this->mailer->send($this->report);
    }
}

#[\Symfony\Component\Scheduler\Attribute\AsCronTask('0 4 * * *')]
final class PruneTokens
{
    public function __invoke(): void
    {
        $this->tokens->deleteExpired();
    }
}

final class ReceiptController
{
    public function store(Request $request)
    {
        $order = Order::create($request->validated());
        $this->mailer->send((new Email())->to($request->user()->email)->subject('Your receipt'));
        return redirect()->route('orders.show', $order);
    }
}
