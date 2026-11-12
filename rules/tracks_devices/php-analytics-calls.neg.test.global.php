<?php
// lexcode-expect: 0
// A file with no namespace that imports the app's own Mixpanel and MatomoTracker: the import
// rebinds the bare names, so they are not the global vendor classes.

use App\Metrics\Local\MatomoTracker;
use App\Metrics\Local\Mixpanel;

function record_locally(string $event): void
{
    Mixpanel::getInstance('local');
    $matomo = new MatomoTracker(1);
}
