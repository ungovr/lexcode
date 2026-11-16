<?php
// lexcode-expect: 4
// phpseclib RSA encryption in the other ways it is written: the default padding, a created key,
// combined padding flags and an aliased import (#13336).

namespace App\Crypto;

use phpseclib3\Crypt\DH as KeyAgreement;
use phpseclib3\Crypt\PublicKeyLoader;
use phpseclib3\Crypt\RSA as Rsa;

final class Sealing
{
    public function defaultPadding(string $pem, string $message): string
    {
        return PublicKeyLoader::load($pem)->encrypt($message);
    }

    public function created(string $message): string
    {
        return Rsa::createKey()->getPublicKey()->encrypt($message);
    }

    public function combined(string $pem)
    {
        return PublicKeyLoader::load($pem)->withPadding(Rsa::ENCRYPTION_OAEP | Rsa::SIGNATURE_PSS);
    }

    public function agree($mine, $theirs): string
    {
        return KeyAgreement::computeSecret($mine, $theirs);
    }
}
