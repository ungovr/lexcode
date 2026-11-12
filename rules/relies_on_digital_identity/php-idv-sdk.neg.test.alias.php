<?php
// lexcode-expect: 0
// The vendors' classes imported under aliases, and the app's own classes of the same short names
// (a records office's own session store and API clients) used by those names. The engine's
// `use X;` also matches `use X as Y;`, so each short-name branch has to step aside where the class
// is aliased.

namespace App\Records;

use App\Records\Local\DefaultApi;
use App\Records\Local\DocScanClient;
use App\Records\Local\VerificationSession;
use App\Records\Local\YotiClient;
use Onfido\Api\DefaultApi as OnfidoApi;
use Stripe\Identity\VerificationSession as StripeSession;
use Yoti\DocScan\DocScanClient as YotiDocScan;
use Yoti\YotiClient as Yoti;

class Archive
{
    public function open(string $id): array
    {
        return [
            VerificationSession::create(['id' => $id]),
            new DefaultApi($id),
            new YotiClient($id),
            new DocScanClient($id),
        ];
    }
}
