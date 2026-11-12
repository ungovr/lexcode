<?php
// lexcode-expect: 0
// The app's own interface in a namespace that ends in Symfony's own namespace, a shim whose
// hashPassword() makes a cache key. The file-text guard must not take the namespace suffix for Symfony's namespace.

namespace App\Cache;

use App\Compat\Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

class KeyMaker
{
    public function __construct(private readonly UserPasswordHasherInterface $keys)
    {
    }

    public function key(object $entry, string $name): string
    {
        return $this->keys->hashPassword($entry, $name);
    }
}
