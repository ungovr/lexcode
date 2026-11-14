<?php
// lexcode-expect: 4
// Account models: the person signs up and signs in with a stored password. Laravel's plain
// import is in php-account-model.test.plain.php, because the short-name branch steps aside in a
// file that also imports the class under an alias.

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface;
use Symfony\Component\Security\Core\User\UserInterface;

// Laravel, through the aliased import every new app ships with.
class Customer extends Authenticatable
{
    protected $fillable = ['name', 'email', 'password'];

    protected $hidden = ['password', 'remember_token'];
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
