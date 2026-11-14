<?php
// lexcode-expect: 0
// What is not a follow or friendship relation between accounts: follow-up tasks and their
// assignee, a course a student follows (a subscription to content, with no other account), a
// "friendly name" field, a redirect follower in an HTTP client, an app's own Follower and
// Friendable traits in another namespace, and Eloquent relations with other names.
namespace App\Models;

use App\Concerns\Follower;
use App\Concerns\Friendable;
use Illuminate\Database\Eloquent\Model;
use Multicaret\Acquaintances\Traits\Friendable as PackageFriendable;
use Overtrue\LaravelFollow\Traits\Follower as PackageFollower;

class FollowUp extends Model
{
    public function assignee()
    {
        return $this->belongsToMany(User::class, 'follow_up_assignees');
    }
}

class CourseFollow
{
    private ?Student $student = null;

    private ?Course $followedCourse = null;

    private string $friendlyName = '';
}

class RedirectFollower
{
    private int $followedRedirects = 0;

    private int $maxRedirects = 5;
}

class Ticket extends Model
{
    // The app's own App\Concerns\Follower: staff watching a support ticket.
    use Follower;

    public function watchers()
    {
        return $this->belongsToMany(User::class, 'ticket_watchers');
    }
}

class Course extends Model
{
    // The app's own App\Concerns\Friendable: a course that can be shared, no accounts befriended.
    use Friendable;
}

class TicketQueries
{
    public function open(int $id)
    {
        return Ticket::where('follow_up_id', $id)->where('owner_id', $id)->get();
    }
}
