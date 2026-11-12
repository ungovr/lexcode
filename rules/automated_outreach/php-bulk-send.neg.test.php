<?php
// lexcode-expect: 0
// Not a batch send: Filament's Notification toast, an app's own Notification class in another
// namespace, the Notification facade to one notifiable, a Mailchimp audience read, a Mailgun send to
// one person, and a report built from many rows.
namespace App\Http\Controllers;

use Filament\Notifications\Notification;
use App\Support\Notification as AppNotification;
use Illuminate\Support\Facades\Notification as NotificationFacade;

final class ProfileController
{
    public function update(Request $request)
    {
        $request->user()->update($request->validated());
        Notification::make()->title('Profile saved')->success()->send();
        AppNotification::send($this->subscribers, 'Profile saved');
        NotificationFacade::sendNow($request->user(), new ProfileUpdated());
        return back();
    }

    public function audience()
    {
        return $this->mailchimp->lists->getListMembersInfo('a1b2c3');
    }

    public function contact(Request $request)
    {
        $this->mailgun->messages()->send('mg.example.com', [
            'from' => $request->input('email'),
            'to' => 'support@example.com',
            'text' => $request->input('message'),
        ]);
        return back();
    }

    public function report()
    {
        return response()->json(Order::all()->map->summary());
    }
}
