<?php
// lexcode-expect: 2
// A Laravel routes/channels.php (no namespace, no class), the Broadcast facade imported by name:
// a private channel for each user's direct messages, and one for a chat room's members.

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('dm.{userId}', function ($user, $userId) {
    return (int) $user->id === (int) $userId;
});

Broadcast::channel('chat-room.{roomId}', fn ($user, $roomId) => $user->rooms->contains($roomId));
