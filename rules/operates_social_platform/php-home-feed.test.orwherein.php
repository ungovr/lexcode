<?php
// lexcode-expect: 1
// A feed whose only follow condition is an or-where-in call, the one form of that method in this
// file: the pre-filter must admit it on its own.
namespace App\Feed;

class PinnedOrFollowedFeed
{
    public function home(User $user)
    {
        return Post::where('pinned', true)
            ->orWhereIn('user_id', $user->following()->pluck('id'))
            ->latest()
            ->get();
    }
}
