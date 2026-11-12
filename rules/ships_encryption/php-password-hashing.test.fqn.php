<?php
// lexcode-expect: 1
// Symfony's password hasher reached only through a fully qualified type, in a file that imports
// nothing from Symfony.

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
