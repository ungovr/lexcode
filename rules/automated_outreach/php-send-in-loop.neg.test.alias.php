<?php
// lexcode-expect: 0
// Laravel's Mail and Notification facades imported under aliases, and the app's own Mail and
// Notification classes (in-app records) used by those names in a loop over users. The engine's
// `use X;` also matches `use X as Y;`, so each short-name branch has to step aside where the class
// is aliased.
namespace App\Http\Controllers;

use App\Support\Mail;
use App\Support\Notification;
use Illuminate\Support\Facades\Mail as MailFacade;
use Illuminate\Support\Facades\Notification as NotificationFacade;

class InboxController extends Controller
{
    public function store(array $users): void
    {
        foreach ($users as $user) {
            Mail::queue($user->draft);
            Notification::send($user, $this->card);
        }
    }
}
