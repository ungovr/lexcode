<?php
// lexcode-expect: 4
// phpseclib version 3's key agreement and RSA set to encrypt (#13336).

namespace App\Crypto;

use phpseclib3\Crypt\DH;
use phpseclib3\Crypt\PublicKeyLoader;
use phpseclib3\Crypt\RSA;

final class Exchange
{
    public function agree($mine, $theirs): string
    {
        return DH::computeSecret($mine, $theirs);
    }

    public function agreeQualified($mine, $theirs): string
    {
        return \phpseclib3\Crypt\DH::computeSecret($mine, $theirs);
    }

    public function sealFor(string $pem, string $message): string
    {
        $key = PublicKeyLoader::load($pem)->withPadding(RSA::ENCRYPTION_OAEP);
        return $key->encrypt($message);
    }

    public function sealLegacy(string $pem, string $message): string
    {
        return PublicKeyLoader::load($pem)->withPadding(RSA::ENCRYPTION_PKCS1)->encrypt($message);
    }
}
