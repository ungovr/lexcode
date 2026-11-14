<?php
// lexcode-expect: 3
// The follow and friendship packages' traits in a model: overtrue/laravel-follow's Follower
// imported by name and written fully qualified, and multicaret/laravel-acquaintances' Friendable
// through an alias.
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Multicaret\Acquaintances\Traits\Friendable as HasFriends;
use Overtrue\LaravelFollow\Traits\Follower;

class Member extends Model
{
    use Follower;
}

class Creator extends Model
{
    use \Overtrue\LaravelFollow\Traits\Follower;
}

class Student extends Model
{
    use HasFactory, HasFriends;
}
