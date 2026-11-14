<?php
// lexcode-expect: 15
// Visits and events sent from the server to a third-party analytics or advertising service that
// follows the visitor with its own id: Segment, PostHog, Mixpanel, Matomo, Amplitude, the Google
// Analytics Measurement Protocol and the Meta Conversions API.

namespace App\Listeners;

use FacebookAds\Object\ServerSide\EventRequest as MetaEvents;
use MatomoTracker as Matomo;
use Mixpanel as MixpanelClient;
use PostHog\PostHog as Product;
use Segment\Segment as Analytics;
use Zumba\Amplitude\Amplitude as AmplitudeClient;

class TrackSignup
{
    public function handle($event): void
    {
        $id = (string) $event->user->id;

        // Segment, aliased and fully qualified.
        Analytics::init(config('services.segment.key'));
        \Segment\Segment::track(['userId' => $id, 'event' => 'Signed Up']);

        // PostHog, aliased and fully qualified.
        Product::init(config('services.posthog.key'));
        \PostHog\PostHog::capture(['distinctId' => $id, 'event' => 'signed up']);

        // Mixpanel, aliased and fully qualified.
        $mixpanel = MixpanelClient::getInstance(config('services.mixpanel.token'));
        $again = \Mixpanel::getInstance(config('services.mixpanel.token'));

        // Matomo, aliased and fully qualified, and its older name.
        $matomo = new Matomo(1, 'https://stats.example.test/');
        $tracker = new \MatomoTracker(1, 'https://stats.example.test/');
        $legacy = new \PiwikTracker(1, 'https://stats.example.test/');

        // Amplitude, aliased and fully qualified.
        AmplitudeClient::getInstance()->init(config('services.amplitude.key'), $id)->logEvent('signup');
        $amplitude = new \Zumba\Amplitude\Amplitude();

        // Meta Conversions API, aliased and fully qualified.
        $request = new MetaEvents(config('services.meta.pixel'));
        $second = new \FacebookAds\Object\ServerSide\EventRequest(config('services.meta.pixel'));

        // Google Analytics Measurement Protocol, GA4 and Universal.
        $ga4 = 'https://www.google-analytics.com/mp/collect?measurement_id=G-XXXX&api_secret=' . config('services.ga.secret');
        $ua = "https://www.google-analytics.com/collect";
    }
}
