<?php
// lexcode-expect: 0
// What is not a feed of other users' posts: follow-up tasks selected by their owner, a user's own
// posts, posts by tag ids, and a "friendly" query that selects products for a store.
namespace App\Feed;

class TaskQueries
{
    public function followUps(User $user)
    {
        $tasks = Task::whereIn('owner_id', $user->followUps()->pluck('id'))->get();
        $mine = Post::whereIn('user_id', [$user->id])->get();
        $tagged = Post::whereIn('tag_id', $user->followedTags()->pluck('id'))->get();
        $sql = "SELECT * FROM tasks WHERE owner_id IN (SELECT id FROM follow_ups WHERE due < NOW())";
        $products = "SELECT * FROM products WHERE user_id IN (SELECT id FROM users) AND kid_friendly = 1";
        return [$tasks, $mine, $tagged, $sql, $products];
    }
}
