<?php
// lexcode-expect: 0
// The vendors' classes imported under aliases, and the app's own classes of the same short names
// (in-house metrics that stay on the app's servers) used by those names. The engine's `use X;` also
// matches `use X as Y;`, so each short-name branch has to step aside where the class is aliased.

namespace App\Metrics;

use App\Metrics\Local\Amplitude;
use App\Metrics\Local\EventRequest;
use App\Metrics\Local\MatomoTracker;
use App\Metrics\Local\Mixpanel;
use App\Metrics\Local\PostHog;
use App\Metrics\Local\Segment;
use FacebookAds\Object\ServerSide\EventRequest as MetaEventRequest;
use MatomoTracker as Matomo;
use Mixpanel as MixpanelClient;
use PostHog\PostHog as PostHogClient;
use Segment\Segment as SegmentClient;
use Zumba\Amplitude\Amplitude as AmplitudeClient;

class InHouseMetrics
{
    public function record(string $event): void
    {
        Segment::track(['event' => $event]);
        PostHog::capture(['event' => $event]);
        Mixpanel::getInstance('local');
        $matomo = new MatomoTracker(1);
        Amplitude::getInstance()->logEvent($event);
        $request = new EventRequest('local');
    }
}
