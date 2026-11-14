<?php
// lexcode-expect: 2
// Sends from a Laravel scheduler closure on the Schedule facade under an alias, and through the Mail
// facade under an alias inside a scheduler closure.
namespace App\Console;

use Illuminate\Support\Facades\Mail as Mailer;
use Illuminate\Support\Facades\Schedule as Cron;

class Kernel
{
    protected function schedule(): void
    {
        Cron::call(fn () => $this->twilio->messages->create(
            $this->onCall->phone,
            ['from' => '+15005550006', 'body' => 'Shift starts in one hour.']
        ))->hourly();

        Cron::call(function () {
            Mailer::to($this->subscribers)->queue(new \App\Mail\WeeklyDigest());
        })->weekly();
    }
}
