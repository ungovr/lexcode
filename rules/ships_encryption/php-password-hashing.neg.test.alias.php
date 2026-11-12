<?php
// lexcode-expect: 0
// Laravel's Hash facade and hasher classes and Symfony's hasher imported under aliases, and the
// app's own classes of the same short names (a content-addressed file store's digests) used by
// those names. The engine's `use X;` also matches `use X as Y;`, so each short-name branch has to
// step aside where the class is aliased.

namespace App\Storage;

use App\Storage\Digest\BcryptHasher;
use App\Storage\Digest\Hash;
use App\Storage\Digest\NativePasswordHasher;
use Illuminate\Hashing\BcryptHasher as LaravelBcrypt;
use Illuminate\Support\Facades\Hash as HashFacade;
use Symfony\Component\PasswordHasher\Hasher\NativePasswordHasher as SymfonyNative;

class FileStore
{
    public function digest(string $contents): array
    {
        return [
            Hash::make($contents),
            new BcryptHasher(),
            new NativePasswordHasher(),
        ];
    }
}
