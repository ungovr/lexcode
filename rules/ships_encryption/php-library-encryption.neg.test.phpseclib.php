<?php
// lexcode-expect: 0
// phpseclib used only to sign, and an app's own DH and RSA classes (#13336).

namespace App\Crypto;

use phpseclib3\Crypt\PublicKeyLoader;
use phpseclib3\Crypt\RSA;
use App\Math\DH;

final class Signer
{
    public function sign(string $pem, string $message): string
    {
        return PublicKeyLoader::load($pem)->withPadding(RSA::SIGNATURE_PSS)->sign($message);
    }

    public function own($a, $b): string
    {
        // The app's own DH class, not phpseclib's.
        return DH::computeSecret($a, $b);
    }
}
