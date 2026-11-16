<?php
// lexcode-expect: 0
// Symfony's password hasher reached only through a fully qualified type: password hashing, not
// encryption.

namespace App\Seeding;

class Seeder
{
    public function __construct(private \Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface $hasher)
    {
    }

    public function seed(object $user): string
    {
        return $this->hasher->hashPassword($user, 'changeme');
    }
}
