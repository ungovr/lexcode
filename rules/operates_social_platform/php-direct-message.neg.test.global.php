<?php
// lexcode-expect: 0
// A file with no namespace that imports the app's own Broadcast class (a status page's feed), so a
// bare Broadcast here is not Laravel's global alias.

use App\Realtime\Broadcast;

Broadcast::channel('chat.{userId}', fn () => true);
Broadcast::channel('messages', fn () => true);
