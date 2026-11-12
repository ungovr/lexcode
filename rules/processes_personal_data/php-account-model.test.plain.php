<?php
// lexcode-expect: 1
// An account model on Laravel's authenticatable user base class through the plain import.

namespace App\Models;

use Illuminate\Foundation\Auth\User;

class Member extends User
{
    protected $hidden = ['password', 'remember_token'];
}
