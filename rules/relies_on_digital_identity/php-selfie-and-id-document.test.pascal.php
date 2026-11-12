<?php
// lexcode-expect: 3
// An app's own payloads with PascalCase keys, as a SOAP or .NET-style verification API takes them:
// a face image held beside an image of a photo ID, in any case.

namespace App\Kyc;

class SoapSubmission
{
    public function payload(string $face, string $document): array
    {
        return ['SelfieImage' => $face, 'IdDocumentFront' => $document];
    }

    public function shortNames(string $face, string $card): array
    {
        return ['Selfie' => $face, 'IDCard' => $card];
    }

    public function mixed(string $face, string $document): array
    {
        return ['selfieImage' => $face, 'IdentityDocument' => $document];
    }
}
