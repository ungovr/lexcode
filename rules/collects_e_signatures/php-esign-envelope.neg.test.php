<?php
// lexcode-expect: 0
// Sending, signing and checking things that are not a person's electronic signature on a
// document: an email, a webhook's HMAC, a JWT, and a checkbox that accepts the terms of service.
// Last, the app's own classes with the vendors' short names (EnvelopesApi, SignatureRequestApi,
// Client) and their method names, in a file that imports no e-signature SDK.

namespace App\Documents;

use App\Mail\EnvelopesApi;
use App\Mail\SignatureRequestApi;
use App\Sales\Client;
use Firebase\JWT\JWT;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

class Documents
{
    public function mail(string $to, object $message): void
    {
        Mail::to($to)->send($message);
    }

    public function webhook(string $body, string $secret): string
    {
        return hash_hmac('sha256', $body, $secret);
    }

    public function token(array $claims, string $key): string
    {
        return JWT::encode($claims, $key, 'HS256');
    }

    public function acceptTerms(Request $request): bool
    {
        return $request->boolean('accept_terms');
    }

    public function own(EnvelopesApi $envelopes, SignatureRequestApi $requests, Client $client): array
    {
        return [
            $envelopes->createEnvelope('account', ['subject' => 'Your order']),
            $requests->signatureRequestSend(['to' => 'someone@example.org']),
            $client->sendSignatureRequest(['note' => 'quarterly report']),
        ];
    }
}
