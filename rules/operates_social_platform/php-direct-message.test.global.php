<?php
// lexcode-expect: 2
// An older Laravel routes/channels.php (no namespace, no class, no import) through the global
// Broadcast alias, bare and with a leading backslash.

Broadcast::channel('chat.{userId}', function ($user, $userId) {
    return (int) $user->id === (int) $userId;
});

\Broadcast::channel('messages.{userId}', fn ($user, $userId) => (int) $user->id === (int) $userId);

Broadcast::channel('App.User.{id}', fn ($user, $id) => (int) $user->id === (int) $id);
