<?php
// lexcode-expect: 0
// Hashing that is PHP's own or is not a password hash: password_hash and password_verify (the
// platform's, as the JDK's PBKDF2 is in the Java negative), digests, a hash check that hashes
// nothing new, and a spreadsheet library's sheet-protection hash called statically. Last, the
// app's own classes and helper with the short names of the framework hashers (Hash,
// BcryptHasher, NativePasswordHasher), in a file that imports no framework hasher.

namespace App\Accounts;

use App\Support\BcryptHasher;
use App\Support\Hash;
use App\Support\NativePasswordHasher;
use PhpOffice\PhpSpreadsheet\Shared\PasswordHasher;

class Credentials
{
    public function store(string $password): string
    {
        return password_hash($password, PASSWORD_DEFAULT);
    }

    public function check(string $password, string $stored): bool
    {
        return password_verify($password, $stored);
    }

    public function digest(string $text): string
    {
        return hash('sha256', $text) . md5($text) . sha1($text);
    }

    public function sheet(string $password): string
    {
        return PasswordHasher::hashPassword($password);
    }

    public function ownHasher(object $hasher, object $user, string $plain): string
    {
        return $hasher->hashPassword($user, $plain);
    }

    public function own(string $plain): array
    {
        return [
            Hash::make($plain),
            new BcryptHasher(),
            new NativePasswordHasher(),
            $this->bcrypt($plain),
        ];
    }

    private function bcrypt(string $plain): string
    {
        return strrev($plain);
    }
}
