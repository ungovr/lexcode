<?php
// lexcode-expect: 25
// PHP's own openssl and sodium extensions used to keep data confidential: symmetric ciphers, RSA
// encryption, an envelope, key agreement, the secret-key and public-key boxes, a sealed box, an
// AEAD and a secret stream, with and without a leading backslash and over several lines.

namespace App\Security;

class FieldCipher
{
    public function seal(string $plain, string $key): string
    {
        $iv = random_bytes(12);
        $sealed = openssl_encrypt($plain, 'aes-256-gcm', $key, OPENSSL_RAW_DATA, $iv, $tag); // 1
        return base64_encode($iv . $tag . $sealed);
    }

    public function open(string $data, string $key, string $iv, string $tag): string|false
    {
        return \openssl_decrypt($data, 'aes-256-gcm', $key, OPENSSL_RAW_DATA, $iv, $tag); // 2
    }

    public function wrap(string $dataKey, $publicKey): string
    {
        openssl_public_encrypt($dataKey, $wrapped, $publicKey, OPENSSL_PKCS1_OAEP_PADDING); // 3
        return $wrapped;
    }

    public function unwrap(string $wrapped, $privateKey): string
    {
        openssl_private_decrypt( // 4
            $wrapped,
            $dataKey,
            $privateKey,
            OPENSSL_PKCS1_OAEP_PADDING
        );
        return $dataKey;
    }

    public function envelope(string $plain, array $publicKeys): array
    {
        openssl_seal($plain, $sealed, $keys, $publicKeys, 'aes-256-cbc', $iv); // 5
        return [$sealed, $keys, $iv];
    }

    public function agree($mine, $peer): string|false
    {
        return openssl_pkey_derive($peer, $mine); // 6
    }

    public function secretBox(string $plain, string $key): string
    {
        $nonce = random_bytes(SODIUM_CRYPTO_SECRETBOX_NONCEBYTES);
        return $nonce . sodium_crypto_secretbox($plain, $nonce, $key); // 7
    }

    public function openSecretBox(string $sealed, string $nonce, string $key): string|false
    {
        return sodium_crypto_secretbox_open($sealed, $nonce, $key); // 8
    }

    public function box(string $plain, string $nonce, string $keypair): string
    {
        return sodium_crypto_box($plain, $nonce, $keypair); // 9
    }

    public function sealFor(string $plain, string $publicKey): string
    {
        return \sodium_crypto_box_seal($plain, $publicKey); // 10
    }

    public function openSealed(string $sealed, string $keypair): string|false
    {
        return sodium_crypto_box_seal_open($sealed, $keypair); // 11
    }

    public function aead(string $plain, string $ad, string $nonce, string $key): array
    {
        return [
            sodium_crypto_aead_xchacha20poly1305_ietf_encrypt($plain, $ad, $nonce, $key), // 12
            sodium_crypto_aead_chacha20poly1305_ietf_encrypt($plain, $ad, $nonce, $key), // 13
            sodium_crypto_aead_aes256gcm_encrypt($plain, $ad, $nonce, $key), // 14
            sodium_crypto_aead_xchacha20poly1305_ietf_decrypt($plain, $ad, $nonce, $key), // 15
        ];
    }

    public function stream(string $key): array
    {
        return sodium_crypto_secretstream_xchacha20poly1305_init_push($key); // 16
    }

    public function exchange(string $clientKeypair, string $serverPublic): array
    {
        $pair = sodium_crypto_kx_keypair(); // 17
        return sodium_crypto_kx_client_session_keys($clientKeypair, $serverPublic); // 18
    }

    public function serverSide(string $serverKeypair, string $clientPublic): array
    {
        return sodium_crypto_kx_server_session_keys($serverKeypair, $clientPublic); // 19
    }

    public function scalar(string $secret, string $peer): string
    {
        return sodium_crypto_scalarmult($secret, $peer); // 20
    }

    public function aegis(string $plain, string $ad, string $nonce, string $key): array
    {
        $sealed = sodium_crypto_aead_aegis256_encrypt($plain, $ad, $nonce, $key); // 21
        return [
            sodium_crypto_aead_aegis256_decrypt($sealed, $ad, $nonce, $key), // 22
            \sodium_crypto_aead_aegis128l_decrypt($sealed, $ad, $nonce, $key), // 23
        ];
    }

    public function legacy(string $plain, string $key, string $iv): string
    {
        $sealed = mcrypt_encrypt(MCRYPT_RIJNDAEL_128, $key, $plain, MCRYPT_MODE_CBC, $iv); // 24
        return \mcrypt_decrypt(MCRYPT_RIJNDAEL_128, $key, $sealed, MCRYPT_MODE_CBC, $iv); // 25
    }
}
