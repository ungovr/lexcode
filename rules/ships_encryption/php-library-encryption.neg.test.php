<?php
// lexcode-expect: 0
// Cryptography that is not encrypting, agreeing keys or opening a secure connection, and library
// code that does something else: hash_hmac, random_bytes and password_hash, JWT signing (a JWS, not
// a JWE), phpseclib loading a key to verify a signature, and stock HTTPS through curl and Guzzle.
// (The openssl and sodium extensions' ciphers are shipping encryption too; php-platform-encryption
// reads them.) Last, the app's own classes that share a library's short names (Crypt, Crypto, Key,
// Encrypter, AES, SFTP, JWEBuilder) in its own namespaces, with no import of the library.

namespace App\Security;

use App\Support\Crypt;
use App\Support\Crypto;
use App\Support\Encrypter;
use App\Support\JWEBuilder;
use App\Support\Key;
use App\Transfer\AES;
use App\Transfer\SFTP;
use Firebase\JWT\JWT;
use GuzzleHttp\Client;
use phpseclib3\Crypt\PublicKeyLoader;

class PlatformCrypto
{
    public function tag(string $body, string $secret): string
    {
        return hash_hmac('sha256', $body, $secret);
    }

    public function hash(string $password): string
    {
        return password_hash($password, PASSWORD_ARGON2ID);
    }

    public function token(array $claims, string $secret): string
    {
        return JWT::encode($claims, $secret, 'HS256');
    }

    public function verifyWithPhpseclib(string $pem, string $message, string $signature): bool
    {
        $key = PublicKeyLoader::load($pem);
        return $key->verify($message, $signature);
    }

    public function fetch(string $url): string
    {
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        $body = (string) curl_exec($ch);
        curl_close($ch);
        return $body . (string) (new Client())->get($url)->getBody();
    }
}

class OwnClasses
{
    public function all(string $value): array
    {
        return [
            Crypt::encryptString($value),
            Crypt::encrypt($value),
            Crypto::encrypt($value, Key::createNewRandomKey()),
            new Encrypter('local-key'),
            new AES('gcm'),
            new SFTP('files.example.org'),
            new JWEBuilder(),
        ];
    }
}
