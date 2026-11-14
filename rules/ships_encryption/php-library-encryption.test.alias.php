<?php
// lexcode-expect: 2
// Laravel's Crypt facade and web-token's JWEBuilder through aliased imports.

namespace App\Security;

use Illuminate\Support\Facades\Crypt as Vault;
use Jose\Component\Encryption\JWEBuilder as Builder;

class Sealing
{
    public function seal(string $value, object $algorithms): array
    {
        return [
            Vault::encrypt($value),
            new Builder($algorithms),
        ];
    }
}
