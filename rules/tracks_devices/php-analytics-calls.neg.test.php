<?php
// lexcode-expect: 0
// Lookalikes: reading an analytics report, learning analytics, error reporting, a header that only
// allows an analytics host, and the app's own Segment, PostHog and Tracker classes with the
// libraries' short names.

namespace App\Telemetry;

use Spatie\Analytics\Facades\Analytics;
use Spatie\Analytics\Period;

class Segment
{
    public static function track(array $event): void
    {
    }
}

class PostHog
{
    public static function capture(array $event): void
    {
    }
}

class Tracker
{
}

class Reports
{
    public function weekly(): array
    {
        // Reading aggregate page views from the analytics reporting API sets nothing on a device.
        return Analytics::fetchVisitorsAndPageViews(Period::days(7))->toArray();
    }

    public function internal(): void
    {
        // The app's own classes in this namespace, not the vendors'.
        Segment::track(['event' => 'export', 'properties' => ['rows' => 10]]);
        PostHog::capture(['event' => 'export']);
        $tracker = new Tracker();
    }

    public function errors(): void
    {
        // Server-side error reporting only.
        \Sentry\init(['dsn' => getenv('SENTRY_DSN')]);
    }

    public function predictions(int $courseId): array
    {
        // Learning analytics: predictions about a course, not a visitor's device.
        return \core_analytics\manager::get_predictions_for_course($courseId);
    }

    public function headers(): string
    {
        // A content-security header that allows the host, not a hit sent to it.
        return "connect-src 'self' https://www.google-analytics.com";
    }
}
