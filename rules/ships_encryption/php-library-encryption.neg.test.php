<?php
// lexcode-expect: 0
// Cryptography that is PHP's own, and library code that is not encrypting, agreeing keys or
// opening a secure connection. PHP's own cryptography is the platform's, the same bar as Go's
// crypto/aes, Node's crypto module and Ruby's OpenSSL bindings in the neighboring negatives: the
// openssl and sodium extensions, hash_hmac, random_bytes and password_hash. JWT signing (a JWS, not
// a JWE), phpseclib loading a key to verify a signature, and stock HTTPS through curl and Guzzle are
// excluded too. Last, the app's own classes that share a library's short names (Crypt, Crypto, Key,
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
    public function sealWithOpenssl(string $plain, string $key): string
    {
        $iv = random_bytes(12);
        $sealed = openssl_encrypt($plain, 'aes-256-gcm', $key, OPENSSL_RAW_DATA, $iv, $tag);
        return base64_encode($iv . $tag . $sealed);
    }

    public function sealWithSodium(string $plain, string $key): string
    {
        $nonce = random_bytes(SODIUM_CRYPTO_SECRETBOX_NONCEBYTES);
        return $nonce . sodium_crypto_secretbox($plain, $nonce, $key);
    }

    public function agreeWithSodium(string $mine, string $theirs): string
    {
        return sodium_crypto_box_seal($mine, $theirs);
    }

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
