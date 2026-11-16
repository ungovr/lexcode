<?php
// lexcode-expect: 3
// phpseclib RSA written fully qualified, in a file that imports nothing from it (#13336).

namespace App\Crypto;

final class Qualified
{
    public function seal(string $pem, string $message): string
    {
        return \phpseclib3\Crypt\PublicKeyLoader::load($pem)->encrypt($message);
    }

    public function open(string $pem, string $ciphertext): string
    {
        $key = \phpseclib3\Crypt\PublicKeyLoader::load($pem);
        return $key->decrypt($ciphertext);
    }

    public function legacy(string $pem, string $message): string
    {
        $rsa = new \phpseclib\Crypt\RSA();
        $rsa->loadKey($pem);
        return $rsa->encrypt($message);
    }
}
