<?php
// lexcode-expect: 0
// The app's own test doubles in namespaces that end in the vendors' own namespaces, which record
// the call and send nothing. The file-text guards must not take the namespace suffix for the
// vendor's namespace.

namespace App\Testing;

use App\Testing\Fakes\DocuSign\eSign\Api\EnvelopesApi;
use App\Testing\Fakes\Dropbox\Sign\Api\SignatureRequestApi;
use App\Testing\Fakes\HelloSign\Client;

class FakeSigning
{
    public function __construct(
        private EnvelopesApi $envelopes,
        private SignatureRequestApi $requests,
        private Client $hellosign,
    ) {
    }

    public function replay(string $accountId, object $definition, object $request): void
    {
        $this->envelopes->createEnvelope($accountId, $definition);
        $this->requests->signatureRequestSend($request);
        $this->hellosign->sendSignatureRequest($request);
    }
}
