<?php
// lexcode-expect: 0
// Laravel's Notification facade imported under an alias, and the app's own Notification class (a
// toast shown in the browser) used by that name with a collection of users. The engine's `use X;`
// also matches `use X as Y;`, so the short-name branch has to step aside where the class is aliased.
namespace App\Http\Controllers;

use App\Support\Notification;
use Illuminate\Support\Facades\Notification as NotificationFacade;

class BannerController extends Controller
{
    public function store(): void
    {
        Notification::send($users, 'Saved.');
    }
}
