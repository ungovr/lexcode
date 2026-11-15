<?php
// lexcode-expect: 0
// Laravel's Hash facade through an aliased import: password hashing, not encryption.

namespace App\Accounts;

use Illuminate\Support\Facades\Hash as Hasher;

class Registration
{
    public function laravel(string $plain): string
    {
        return Hasher::make($plain);
    }
}
