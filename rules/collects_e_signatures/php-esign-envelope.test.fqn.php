<?php
// lexcode-expect: 1
// DocuSign's eSignature client reached only by its fully qualified name, in a file that imports
// nothing from DocuSign.

namespace App\Signing;

class LeaseSigning
{
    public function send(object $apiClient, string $accountId, object $definition): object
    {
        $envelopes = new \DocuSign\eSign\Api\EnvelopesApi($apiClient);
        return $envelopes->createEnvelope($accountId, $definition);
    }
}
