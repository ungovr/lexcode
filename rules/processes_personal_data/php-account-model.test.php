<?php
// lexcode-expect: 5
// Account models: the person signs up and signs in with a stored password.

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Foundation\Auth\User;
use Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface;
use Symfony\Component\Security\Core\User\UserInterface;

// Laravel, through the aliased import every new app ships with.
class Customer extends Authenticatable
{
    protected $fillable = ['name', 'email', 'password'];

    protected $hidden = ['password', 'remember_token'];
}

// Laravel, through the plain import.
class Member extends User
{
}

// Laravel, fully qualified.
class Admin extends \Illuminate\Foundation\Auth\User
{
}

// Symfony, through the import, beside another interface.
class Account implements UserInterface, PasswordAuthenticatedUserInterface
{
    private ?string $password = null;

    public function getPassword(): ?string
    {
        return $this->password;
    }
}

// Symfony, fully qualified.
class Reader implements \Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface
{
    public function getPassword(): ?string
    {
        return null;
    }
}
