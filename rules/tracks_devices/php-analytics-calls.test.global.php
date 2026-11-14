<?php
// lexcode-expect: 2
// Mixpanel and Matomo, two classes in the global namespace, under their plain imports.

namespace App\Analytics;

use MatomoTracker;
use Mixpanel;

class ServerSideEvents
{
    public function record(string $event): void
    {
        $mixpanel = Mixpanel::getInstance(config('services.mixpanel.token'));
        $matomo = new MatomoTracker(1, 'https://stats.example.test/');
    }
}
