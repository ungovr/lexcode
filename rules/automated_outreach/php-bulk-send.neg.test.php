<?php
// lexcode-expect: 0
// Not a batch send: Filament's Notification toast, an app's own Notification class in another
// namespace imported under the short name and sent to many, the Notification facade to one
// notifiable, to one address and to the administrators, a Mailchimp audience read, a Mailgun send to
// one person, and a report built from many rows.
namespace App\Http\Controllers;

use Filament\Notifications\Notification as Toast;
use App\Support\Notification;

final class ProfileController
{
    public function update(Request $request)
    {
        $request->user()->update($request->validated());
        Toast::make()->title('Profile saved')->success()->send();
        Notification::send($this->subscribers, 'Profile saved');
        \Illuminate\Support\Facades\Notification::sendNow($request->user(), new ProfileUpdated());
        return back();
    }

    public function invite(Request $request, array $admins)
    {
        $address = $request->input('email');
        \Illuminate\Support\Facades\Notification::route('mail', $address)->notify(new Invitation());
        \Illuminate\Support\Facades\Notification::send($address, new Invitation());
        \Illuminate\Support\Facades\Notification::send($admins, new InvitationSent($address));
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
