<?php
// lexcode-expect: 0
// PHP's own cryptography that encrypts nothing and agrees no key: digests, MACs, password hashing
// and key derivation, signing with openssl and sodium, random bytes and a generated key pair, then
// HTTPS through file_get_contents, curl and Guzzle. Last, the app's own methods with the
// extensions' names, called on an object.

namespace App\Accounts;

use Firebase\JWT\JWT;
use GuzzleHttp\Client;

class Integrity
{
    public function digest(string $text): string
    {
        return hash('sha256', $text) . md5($text) . sodium_crypto_generichash($text);
    }

    public function mac(string $body, string $secret, string $key): array
    {
        return [hash_hmac('sha256', $body, $secret), sodium_crypto_auth($body, $key)];
    }

    public function passwords(string $password, string $salt): array
    {
        return [
            password_hash($password, PASSWORD_ARGON2ID),
            password_verify($password, '$2y$10$abc'),
            sodium_crypto_pwhash_str($password, SODIUM_CRYPTO_PWHASH_OPSLIMIT_INTERACTIVE, SODIUM_CRYPTO_PWHASH_MEMLIMIT_INTERACTIVE),
            hash_pbkdf2('sha256', $password, $salt, 600000, 32),
            sodium_crypto_kdf_derive_from_key(32, 1, 'context0', random_bytes(32)),
        ];
    }

    public function sign(string $data, $privateKey, string $signKey): array
    {
        openssl_sign($data, $signature, $privateKey, OPENSSL_ALGO_SHA256);
        return [
            $signature,
            sodium_crypto_sign_detached($data, $signKey),
            JWT::encode(['sub' => 'u1'], 'secret', 'HS256'),
        ];
    }

    public function random(): array
    {
        return [random_bytes(32), openssl_random_pseudo_bytes(16), openssl_pkey_new(['private_key_bits' => 2048])];
    }

    public function fetch(string $url): string
    {
        $page = file_get_contents('https://api.example.org/v1/items');
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        return $page . (string) curl_exec($ch) . (string) (new Client())->get($url)->getBody();
    }

    public function own(object $vault): array
    {
        return [$vault->openssl_encrypt('x'), $vault->sodium_crypto_box('y')];
    }
}
