<?php
// lexcode-expect: 0
// The libraries' classes imported under aliases, and the app's own classes of the same short names
// (a vault of stored notes, a test double, a report builder) used by those names. The engine's
// `use X;` also matches `use X as Y;`, so each short-name branch has to step aside where the class
// is aliased.

namespace App\Notes;

use App\Notes\Local\AES;
use App\Notes\Local\Crypt;
use App\Notes\Local\Crypto;
use App\Notes\Local\Encrypter;
use App\Notes\Local\JWEBuilder;
use App\Notes\Local\KeyFactory;
use Defuse\Crypto\Crypto as DefuseCrypto;
use Illuminate\Encryption\Encrypter as LaravelEncrypter;
use Illuminate\Support\Facades\Crypt as Vault;
use Jose\Component\Encryption\JWEBuilder as Builder;
use ParagonIE\Halite\KeyFactory as HaliteKeys;
use phpseclib3\Crypt\AES as Cipher;

class Archive
{
    public function store(string $value): array
    {
        return [
            Crypt::encrypt($value),
            new Encrypter($value),
            Crypto::encrypt($value, 'archive'),
            KeyFactory::generateEncryptionKey(),
            new AES('archive'),
            new JWEBuilder('archive'),
        ];
    }
}
