<?php
// lexcode-expect: 9
// Hashing passwords with a framework's hasher: Laravel's Hash facade (imported, fully qualified
// and through the global alias; aliased in php-password-hashing.test.alias.php), its bcrypt() helper and hasher classes, and Symfony's
// password hasher, through an injected service and the hasher classes.

namespace App\Accounts;

use Illuminate\Hashing\BcryptHasher;
use Illuminate\Support\Facades\Hash;
use Symfony\Component\PasswordHasher\Hasher\NativePasswordHasher as Native;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

class Registration
{
    public function __construct(private readonly UserPasswordHasherInterface $passwordHasher)
    {
    }

    public function laravel(string $plain): array
    {
        return [
            Hash::make($plain),
            \Illuminate\Support\Facades\Hash::make($plain),
            \Hash::make($plain),
            bcrypt($plain),
            new BcryptHasher(['rounds' => 12]),
            new \Illuminate\Hashing\Argon2IdHasher(),
        ];
    }

    public function symfony(object $user, string $plain): array
    {
        return [
            $this->passwordHasher->hashPassword($user, $plain),
            new Native(),
            new \Symfony\Component\PasswordHasher\Hasher\SodiumPasswordHasher(),
        ];
    }
}
