<?php
// lexcode-expect: 0
// Laravel's authenticatable User and Symfony's password interface imported under aliases, and the
// app's own User base class and interface of the same short names (a directory listing and an API
// key holder, neither of which signs in with a stored password) used by those names. The engine's
// `use X;` also matches `use X as Y;`, so each short-name branch has to step aside where the class
// is aliased.

namespace App\Directory;

use App\Directory\Base\PasswordAuthenticatedUserInterface;
use App\Directory\Base\User;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface as PasswordUser;

class Moderator extends User
{
}

class ApiClient implements PasswordAuthenticatedUserInterface
{
}
