<?php
// lexcode-expect: 0
// Documents that are not signed with a key, and signatures that are not on a document: an email's
// signature block and a JWT, in a file that names no PDF signing library; a signer of the app's
// own; and a payload signed with PHP's own openssl_sign.

namespace App\Mail;

use App\Pdf\Signer;
use Firebase\JWT\JWT;

class Footer
{
    public function apply(object $mailer, string $html): void
    {
        $mailer->setSignature($html);
    }

    public function token(array $claims, string $key): string
    {
        return JWT::encode($claims, $key, 'HS256');
    }

    public function own(Signer $signer, string $document): string
    {
        return $signer->sign($document);
    }

    public function platform(string $data, \OpenSSLAsymmetricKey $key): string
    {
        openssl_sign($data, $signature, $key, OPENSSL_ALGO_SHA256);
        return $signature;
    }
}
