<?php
// lexcode-expect: 18
// Encrypting data, agreeing keys or opening a secure connection with a cryptography library the
// product bundles. Each library class is used once through an aliased import and once fully
// qualified, besides its plain import. The Crypt facade and JWEBuilder, imported plainly here, are
// aliased in php-library-encryption.test.alias.php, because the short-name branch steps aside in a
// file that also imports the class under an alias.

namespace App\Security;

use Defuse\Crypto\Crypto;
use Defuse\Crypto\Key as DefuseKey;
use Illuminate\Encryption\Encrypter as LaravelEncrypter;
use Illuminate\Support\Facades\Crypt;
use Jose\Component\Encryption\JWEBuilder;
use ParagonIE\Halite\KeyFactory;
use ParagonIE\Halite\Symmetric\Crypto as Symmetric;
use phpseclib3\Crypt\AES;
use phpseclib3\Crypt\ChaCha20 as Stream;
use phpseclib3\Net\SFTP;

class Sealing
{
    // Laravel's encrypter: the facade imported, fully qualified and through the global alias, then
    // the Encrypter class aliased and fully qualified.
    public function laravel(string $value): array
    {
        return [
            Crypt::encryptString($value),
            \Illuminate\Support\Facades\Crypt::encryptString($value),
            \Crypt::encrypt($value),
            new LaravelEncrypter(random_bytes(32), 'aes-256-gcm'),
            new \Illuminate\Encryption\Encrypter(random_bytes(32), 'aes-256-gcm'),
        ];
    }

    // defuse/php-encryption.
    public function defuse(string $value, string $password): array
    {
        $key = DefuseKey::createNewRandomKey();
        $other = \Defuse\Crypto\Key::createNewRandomKey();
        return [
            Crypto::encrypt($value, $key),
            \Defuse\Crypto\Crypto::encryptWithPassword($value, $password),
            $other,
        ];
    }

    // Halite.
    public function halite(string $value): string
    {
        $key = KeyFactory::generateEncryptionKey();
        $box = \ParagonIE\Halite\Asymmetric\Crypto::seal(new \ParagonIE\HiddenString\HiddenString($value), $key);
        return Symmetric::encrypt(new \ParagonIE\HiddenString\HiddenString($value), $key) . $box;
    }

    // phpseclib ciphers, version 3 and version 2, and its SSH stack.
    public function phpseclib(string $host): array
    {
        return [
            new AES('gcm'),
            new Stream(),
            new \phpseclib\Crypt\Rijndael(),
            new SFTP($host),
        ];
    }

    // A JWE (an encrypted token, not a signed one).
    public function jwe(object $algorithms): array
    {
        return [
            new JWEBuilder($algorithms),
            new \Jose\Component\Encryption\JWEBuilder($algorithms),
        ];
    }
}
