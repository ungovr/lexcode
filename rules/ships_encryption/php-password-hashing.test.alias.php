<?php
// lexcode-expect: 1
// Laravel's Hash facade through an aliased import.

namespace App\Accounts;

use Illuminate\Support\Facades\Hash as Hasher;

class Registration
{
    public function laravel(string $plain): string
    {
        return Hasher::make($plain);
    }
}
