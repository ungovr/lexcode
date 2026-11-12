<?php
// lexcode-expect: 11
// Checking who a person is with an identity-verification service: Stripe Identity (the static
// resources and the client's services), Onfido's API client and Yoti's clients. Each vendor class
// is used through its plain import, through an aliased import and fully qualified. Onfido's
// aliased import is in php-idv-sdk.test.alias.php, because the short-name branch steps aside in a
// file that also imports the class under an alias.

namespace App\Identity;

use Onfido\Api\DefaultApi;
use Stripe\Identity\VerificationReport as Report;
use Stripe\Identity\VerificationSession;
use Stripe\StripeClient;
use Yoti\DocScan\DocScanClient;
use Yoti\YotiClient as Yoti;

class IdentityChecks
{
    public function stripeStatic(int $userId)
    {
        $session = VerificationSession::create([
            'type' => 'document',
            'options' => ['document' => ['require_matching_selfie' => true]],
            'metadata' => ['user_id' => $userId],
        ]);
        $again = \Stripe\Identity\VerificationSession::create(['type' => 'document']);
        $report = Report::retrieve('vr_123');
        return [$session, $again, $report];
    }

    public function stripeClient(StripeClient $stripe)
    {
        $session = $stripe->identity->verificationSessions->create(['type' => 'document']);
        $report = $stripe->identity->verificationReports->retrieve($session->last_verification_report);
        return [$session, $report];
    }

    public function onfido(object $config, object $http)
    {
        return [
            new DefaultApi($http, $config),
            new \Onfido\Api\DefaultApi($http, $config),
        ];
    }

    public function yoti(string $sdkId, string $pem)
    {
        return [
            new Yoti($sdkId, $pem),
            new \Yoti\YotiClient($sdkId, $pem),
            new DocScanClient($sdkId, $pem),
            new \Yoti\DocScan\DocScanClient($sdkId, $pem),
        ];
    }
}
