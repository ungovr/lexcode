<?php
// lexcode-expect: 0
// The app's own Mixpanel and MatomoTracker classes (in-house metrics that stay on the app's
// servers), imported plainly and under aliases from the app's namespace. The engine's one-segment
// import pattern for the global Mixpanel class also matches the app's import of its own Mixpanel,
// so the import of the global classes has to be read on the file's text.

namespace App\Metrics;

use App\Metrics\Local\MatomoTracker;
use App\Metrics\Local\Mixpanel;
use App\Metrics\Local\Mixpanel as LocalMixpanel;
use App\Metrics\Local\MatomoTracker as LocalTracker;

class InHouseMetrics
{
    public function record(string $event): void
    {
        Mixpanel::getInstance('local');
        $matomo = new MatomoTracker(1);
        LocalMixpanel::getInstance('local');
        $tracker = new LocalTracker(1);
    }
}
