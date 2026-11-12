<?php
// lexcode-expect: 6
// Sending a document to a person for electronic signature: DocuSign's eSignature client, Dropbox
// Sign's signature request client and the legacy HelloSign client, through plain and aliased
// imports.

namespace App\Signing;

use DocuSign\eSign\Api\EnvelopesApi as Envelopes;
use DocuSign\eSign\Model\EnvelopeDefinition;
use Dropbox\Sign\Api\SignatureRequestApi;
use HelloSign\Client;

class SendForSignature
{
    public function docusign(object $apiClient, string $accountId, EnvelopeDefinition $definition): object
    {
        $envelopes = new Envelopes($apiClient);
        return $envelopes->createEnvelope($accountId, $definition);
    }

    public function dropboxSign(SignatureRequestApi $api, object $request, object $templated, object $embedded): array
    {
        return [
            $api->signatureRequestSend($request),
            $api->signatureRequestSendWithTemplate($templated),
            $api->signatureRequestCreateEmbedded($embedded),
        ];
    }

    public function hellosign(object $request, object $templated): array
    {
        $client = new Client(getenv('HELLOSIGN_API_KEY'));
        return [$client->sendSignatureRequest($request), $client->sendTemplateSignatureRequest($templated)];
    }
}
