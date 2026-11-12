<?php
// lexcode-expect: 0
// What is not a message between accounts: an email or SMS with a sender and a recipient, a
// contact-form message to staff, a plain class named Message with sender and recipient fields (a
// mail transport's envelope, no stored link between accounts), an Eloquent message with only a
// recipient (a system notice), the default notification and order channels, and an app's own
// Broadcast class in another namespace.
namespace App\Mail;

use App\Realtime\Broadcast;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Broadcast as Channels;

class EmailMessage
{
    private string $sender;

    private string $recipient;
}

class SmsDirectMessage
{
    public function __construct(public string $sender, public string $recipient) {}
}

class ContactMessage extends Model
{
    public function sender()
    {
        return $this->belongsTo(Visitor::class);
    }

    public function recipient()
    {
        return $this->belongsTo(StaffInbox::class);
    }
}

class Message
{
    public string $sender = 'noreply@example.org';

    public string $recipient = '';
}

class SystemMessage extends Model
{
    public function recipient()
    {
        return $this->belongsTo(User::class);
    }
}

class ChannelRoutes
{
    public static function register(): void
    {
        Channels::channel('App.Models.User.{id}', fn ($user, $id) => (int) $user->id === (int) $id);
        Channels::channel('orders.{orderId}', fn ($user, $orderId) => $user->owns($orderId));
        // The app's own App\Realtime\Broadcast, a status page's feed, not Laravel's facade.
        Broadcast::channel('status-messages', fn () => true);
    }
}
